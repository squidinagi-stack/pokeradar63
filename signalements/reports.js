/* Interface des signalements (module ES).
   Observations personnelles stockées localement, exportables et importables.
   Aucune synchronisation multi-appareils : c'est affiché honnêtement. */
import { normalizeReport, validateReport, freshnessBucket, FRESHNESS_LABELS, STATUS_LABELS, mergeReports, serializeReports, parseReportsPayload, filterReports } from '../reports-core.mjs';

const $ = id => document.getElementById(id);
const KEY = 'pokeradar63.reports.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const write = rs => localStorage.setItem(KEY, JSON.stringify(rs));
const stores = (window.PR_STORES && window.PR_STORES.stores) || [];
const storeName = id => (stores.find(s => s.id === id) || {}).name || id;

// Remplissage des sélecteurs de magasins
for (const sel of [$('store'), $('fStore')]) {
  for (const s of stores) sel.append(new Option(s.name + ' — ' + s.city, s.id));
}

let photoData = null;
$('photo').addEventListener('change', async () => {
  photoData = null;
  const file = $('photo').files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { $('formError').textContent = 'Le fichier choisi n’est pas une image.'; return; }
  const dataURL = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  if (dataURL.length > 700000) { $('formError').textContent = 'Photo trop volumineuse (environ 700 Ko max) : réduisez-la avant.'; return; }
  photoData = dataURL;
  $('formError').textContent = '';
});

function render() {
  const reports = read();
  const list = filterReports(reports, { storeId: $('fStore').value, status: $('fStatus').value, bucket: $('fBucket').value });
  $('count').textContent = list.length + ' observation(s) affichée(s) · ' + reports.length + ' au total';
  $('cards').replaceChildren();
  for (const r of list) {
    const card = document.createElement('article');
    const head = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = r.productName;
    const where = document.createElement('p');
    where.className = 'muted';
    where.textContent = storeName(r.storeId);
    const badge = document.createElement('span');
    badge.className = 'badge b-' + r.status;
    badge.textContent = STATUS_LABELS[r.status];
    head.append(h3, where, badge);
    card.append(head);
    if (photoAllowed(r)) { const img = document.createElement('img'); img.className = 'thumb'; img.src = r.photo; img.alt = 'Photo de preuve'; card.append(img); }
    const details = document.createElement('div');
    const bits = [];
    if (r.price !== null) bits.push('Prix : ' + r.price + ' €');
    if (r.quantity !== null) bits.push('Quantité : ' + r.quantity);
    if (bits.length) { const p = document.createElement('p'); p.textContent = bits.join(' · '); details.append(p); }
    if (r.note) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = r.note; details.append(p); }
    const fresh = freshnessBucket(r.observedAt);
    const fp = document.createElement('p');
    fp.className = 'muted fresh-' + fresh;
    fp.textContent = FRESHNESS_LABELS[fresh] + ' · ' + new Date(r.observedAt).toLocaleString('fr-FR');
    details.append(fp);
    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Supprimer';
    del.onclick = () => { write(read().filter(x => x.id !== r.id)); render(); };
    details.append(del);
    card.append(details);
    $('cards').append(card);
  }
  if (!list.length) $('cards').append(Object.assign(document.createElement('p'), { className: 'muted', textContent: reports.length ? 'Aucune observation ne correspond aux filtres.' : 'Aucune observation enregistrée sur cet appareil. La première est à saisir ci-dessus.' }));
}
const photoAllowed = r => r.photo;

$('form').addEventListener('submit', e => {
  e.preventDefault();
  $('formError').textContent = '';
  const draft = {
    storeId: $('store').value,
    productName: $('product').value,
    status: $('status').value,
    price: $('price').value,
    quantity: $('quantity').value,
    note: $('note').value,
    photo: photoData,
    observedAt: new Date().toISOString()
  };
  const v = validateReport({ ...draft, price: draft.price === '' ? null : Number(draft.price), quantity: draft.quantity === '' ? null : Number(draft.quantity) }, stores);
  if (!v.ok) { $('formError').textContent = v.errors.join(' '); return; }
  const clean = normalizeReport({ ...draft, price: draft.price === '' ? null : Number(draft.price), quantity: draft.quantity === '' ? null : Number(draft.quantity) }, stores);
  write(mergeReports(read(), [clean]));
  $('product').value = ''; $('price').value = ''; $('quantity').value = ''; $('note').value = '';
  $('photo').value = ''; photoData = null;
  render();
});

$('export').addEventListener('click', () => {
  const blob = new Blob([serializeReports(read())], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pokeradar63-signalements.json';
  a.click();
  URL.revokeObjectURL(a.href);
  $('ioMsg').textContent = 'Export généré : conserve ce fichier, il contient tes observations.';
});

$('import').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async () => {
  const file = $('importFile').files[0];
  if (!file) return;
  $('ioMsg').textContent = '';
  const text = await file.text();
  const res = parseReportsPayload(text, stores);
  if (!res.ok) { $('ioMsg').textContent = res.error; return; }
  write(mergeReports(read(), res.reports));
  const rejected = res.rejected ? ' · ' + res.rejected + ' signalement(s) invalide(s) ignoré(s)' : '';
  $('ioMsg').textContent = res.reports.length + ' observation(s) importée(s)' + rejected;
  render();
});

['fStore', 'fStatus', 'fBucket'].forEach(id => $(id).addEventListener('change', render));
$('health').textContent = stores.length + ' magasins sourcés disponibles · stockage local, export et import manuels.';
render();
