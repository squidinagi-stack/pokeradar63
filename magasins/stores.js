const data = window.PR_STORES, $ = id => document.getElementById(id);
const DAYS = { mon: 'Lun', tue: 'Mar', wed: 'Mer', thu: 'Jeu', fri: 'Ven', sat: 'Sam', sun: 'Dim' };
const VERIF = {
  official: { label: 'Confirmé (site officiel)', cls: 'verified' },
  aggregator: { label: 'Confirmé (annuaire)', cls: 'agg' },
  community: { label: 'Annuaire TCG, à confirmer', cls: 'unverified' }
};
const city = $('city');
[...new Set(data.stores.map(s => s.city))].sort().forEach(c => city.append(new Option(c, c)));

function itineraryURL(s) {
  const q = encodeURIComponent(`${s.address}, ${s.postalCode} ${s.city}, France`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function storeCard(s) {
  const a = document.createElement('article');
  const tag = document.createElement('span');
  const v = VERIF[s.verification] || VERIF.community;
  tag.className = 'tag ' + v.cls;
  tag.textContent = v.label;
  a.append(tag, document.createElement('h2')).textContent = s.name;
  const cat = document.createElement('p');
  cat.className = 'muted';
  cat.textContent = s.category;
  a.append(cat);
  const addr = document.createElement('p');
  addr.textContent = `${s.address} · ${s.postalCode} ${s.city}`;
  a.append(addr);
  const today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  if (s.hours && Object.keys(s.hours).length) {
    const h = document.createElement('p');
    h.className = 'muted';
    const range = s.hours[today] || '—';
    h.textContent = `Aujourd'hui (${DAYS[today]}) : ${range}`;
    a.append(h);
  }
  const actions = document.createElement('p');
  if (s.phone) {
    const call = document.createElement('a');
    call.href = 'tel:' + s.phone;
    call.textContent = 'Appeler';
    actions.append(call, document.createTextNode(' · '));
  }
  const map = document.createElement('a');
  map.href = itineraryURL(s);
  map.target = '_blank';
  map.rel = 'noopener noreferrer';
  map.textContent = 'Itinéraire';
  actions.append(map);
  a.append(actions);
  const src = data.sources[s.sourceKey];
  if (src) {
    const p = document.createElement('p');
    p.className = 'muted src';
    const link = document.createElement('a');
    link.href = src.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = src.label;
    p.append('Source : ', link, ` · vérifié le ${s.lastChecked}`);
    a.append(p);
  }
  return a;
}
function render() {
  const q = $('q').value.toLowerCase(), c = city.value, v = $('verified').value;
  const list = data.stores.filter(s =>
    (!c || s.city === c) &&
    (!v || s.verification === v) &&
    (s.name + ' ' + s.city + ' ' + s.category + ' ' + s.services.join(' ')).toLowerCase().includes(q));
  const counts = { official: 0, aggregator: 0, community: 0 };
  data.stores.forEach(s => counts[s.verification] = (counts[s.verification] || 0) + 1);
  $('count').textContent = `${list.length} boutique(s) affichée(s) · ${counts.official} confirmée(s) site officiel · ${counts.aggregator} annuaire · ${counts.community} à confirmer`;
  $('cards').replaceChildren();
  for (const s of list) $('cards').append(storeCard(s));
  if (!list.length) $('cards').append(Object.assign(document.createElement('p'), { textContent: 'Aucune boutique ne correspond aux filtres.' }));
}
['q', 'city', 'verified'].forEach(id => $(id).addEventListener('input', render));
$('health').textContent = `${data.stores.length} boutiques réelles répertoriées dans le 63 · aucune disponibilité de produit n'est affirmée.`;
render();
