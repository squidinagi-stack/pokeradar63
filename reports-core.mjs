/* Noyau des signalements de disponibilité — fonctions pures testables.
   Règle : un signalement est une observation personnelle datée, jamais une
   confirmation de stock. La fraîcheur est affichée, rien n'est inventé. */

export const STATUSES = ['en-rayon', 'rupture', 'tirage-au-sort', 'vente-decalee'];
export const STATUS_LABELS = {
  'en-rayon': 'Vu en rayon',
  'rupture': 'Rupture constatée',
  'tirage-au-sort': 'Tirage au sort',
  'vente-decalee': 'Vente décalée'
};
export const MAX_REPORTS = 500;

export function validateReport(r, stores) {
  const errors = [];
  if (!r || typeof r !== 'object') return { ok: false, errors: ['Signalement invalide.'] };
  const storeIds = new Set((stores || []).map(s => s.id));
  if (!storeIds.has(r.storeId)) errors.push('Magasin inconnu ou non sourcé.');
  const product = String(r.productName || '').trim();
  if (!product) errors.push('Nom du produit requis.');
  if (product.length > 80) errors.push('Nom du produit trop long (80 caractères max).');
  if (!STATUSES.includes(r.status)) errors.push('État observé inconnu.');
  if (r.price !== null && r.price !== undefined && r.price !== '') {
    const p = Number(r.price);
    if (!Number.isFinite(p) || p < 0 || p > 9999) errors.push('Prix invalide (0 à 9999 €).');
  }
  if (r.quantity !== null && r.quantity !== undefined && r.quantity !== '') {
    const q = Number(r.quantity);
    if (!Number.isInteger(q) || q < 0 || q > 999) errors.push('Quantité invalide (0 à 999).');
  }
  const note = String(r.note || '').trim();
  if (note.length > 240) errors.push('Note trop longue (240 caractères max).');
  const t = Date.parse(r.observedAt);
  if (!Number.isFinite(t)) errors.push('Date d’observation invalide.');
  else {
    const now = Date.now();
    if (t > now + 5 * 60 * 1000) errors.push('Date d’observation dans le futur.');
    if (t < now - 365 * 24 * 3600 * 1000) errors.push('Observation trop ancienne (plus d’un an).');
  }
  return { ok: errors.length === 0, errors, product, note };
}

export function freshnessBucket(observedAt, now = Date.now()) {
  const t = Date.parse(observedAt);
  if (!Number.isFinite(t)) return 'invalide';
  const h = (now - t) / 3600000;
  if (h < 0) return 'invalide';
  if (h <= 48) return 'fraîche';
  if (h <= 24 * 7) return 'récente';
  if (h <= 24 * 30) return 'ancienne';
  return 'périmée';
}

export const FRESHNESS_LABELS = {
  'fraîche': 'Observation fraîche (moins de 48 h)',
  'récente': 'Observation de la semaine',
  'ancienne': 'Observation ancienne (plus de 7 jours)',
  'périmée': 'Observation périmée (plus de 30 jours) — à ne plus considérer',
  'invalide': 'Date invalide'
};

export function normalizeReport(r, stores) {
  const v = validateReport(r, stores);
  if (!v.ok) return null;
  return {
    id: r.id || ('r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
    storeId: r.storeId,
    productName: v.product,
    status: r.status,
    price: (r.price === null || r.price === undefined || r.price === '') ? null : Number(r.price),
    quantity: (r.quantity === null || r.quantity === undefined || r.quantity === '') ? null : Number(r.quantity),
    note: v.note || null,
    photo: (typeof r.photo === 'string' && r.photo.startsWith('data:image/') && r.photo.length < 700000) ? r.photo : null,
    observedAt: r.observedAt,
    createdAt: r.createdAt || new Date().toISOString()
  };
}

export function mergeReports(existing, incoming) {
  const map = new Map();
  for (const r of existing || []) map.set(r.id, r);
  for (const r of incoming || []) {
    const before = map.get(r.id);
    if (!before || Date.parse(r.observedAt) >= Date.parse(before.observedAt)) map.set(r.id, r);
  }
  return [...map.values()].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, MAX_REPORTS);
}

export function serializeReports(reports, meta = {}) {
  return JSON.stringify({ app: 'pokeradar63', kind: 'signalements', version: 1, exportedAt: new Date().toISOString(), ...meta, reports: reports || [] }, null, 2);
}

export function parseReportsPayload(text, stores) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, error: 'Fichier illisible : ce n’est pas un export PokéRadar valide.' }; }
  if (!data || data.app !== 'pokeradar63' || data.kind !== 'signalements' || !Array.isArray(data.reports)) {
    return { ok: false, error: 'Structure d’export non reconnue. Aucun import effectué.' };
  }
  const clean = [];
  const rejected = [];
  for (const r of data.reports) {
    const n = normalizeReport(r, stores);
    if (n) clean.push(n); else rejected.push(r);
  }
  if (clean.length > MAX_REPORTS) return { ok: false, error: `Trop de signalements (${clean.length}, maximum ${MAX_REPORTS}).` };
  return { ok: true, reports: clean, rejected: rejected.length };
}

export function filterReports(reports, { storeId, status, bucket } = {}, now = Date.now()) {
  return (reports || []).filter(r =>
    (!storeId || r.storeId === storeId) &&
    (!status || r.status === status) &&
    (!bucket || freshnessBucket(r.observedAt, now) === bucket));
}
