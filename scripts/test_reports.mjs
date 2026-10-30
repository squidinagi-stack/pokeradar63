import { validateReport, normalizeReport, freshnessBucket, mergeReports, serializeReports, parseReportsPayload, filterReports, STATUSES } from '../reports-core.mjs';

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('ok  -', name); } else { fail++; console.error('FAIL -', name); } };

const STORES = [{ id: 'gamecash-clermont', name: 'GameCash' }, { id: 'smyths-clermont', name: 'Smyths' }];
const now = Date.now();
const base = { storeId: 'gamecash-clermont', productName: 'UPC 30 ans — Jour', status: 'en-rayon', price: 59.9, quantity: 3, note: 'Rayon entrée', observedAt: new Date(now - 3600000).toISOString() };

// Validation
check('signalement valide accepté', validateReport(base, STORES).ok);
check('magasin inconnu rejeté', !validateReport({ ...base, storeId: 'inconnu' }, STORES).ok);
check('produit vide rejeté', !validateReport({ ...base, productName: '  ' }, STORES).ok);
check('état inconnu rejeté', !validateReport({ ...base, status: 'magique' }, STORES).ok);
check('prix négatif rejeté', !validateReport({ ...base, price: -5 }, STORES).ok);
check('quantité décimale rejetée', !validateReport({ ...base, quantity: 2.5 }, STORES).ok);
check('date future rejetée', !validateReport({ ...base, observedAt: new Date(now + 3600000).toISOString() }, STORES).ok);
check('note trop longue rejetée', !validateReport({ ...base, note: 'x'.repeat(241) }, STORES).ok);
check('photo non-image rejetée', normalizeReport({ ...base, photo: 'data:text/html;base64,xx' }, STORES).photo === null);

// Normalisation
const n = normalizeReport(base, STORES);
check('normalisation garde le produit nettoyé', n && n.productName === 'UPC 30 ans — Jour');
check('normalisation génère un id', n && /^r[a-z0-9]+$/.test(n.id));
check('prix conservé en nombre', n.price === 59.9);
check('quantité conservée en entier', n.quantity === 3);

// Fraîcheur
check('fraîche < 48h', freshnessBucket(new Date(now - 10 * 3600000).toISOString(), now) === 'fraîche');
check('récente < 7j', freshnessBucket(new Date(now - 3 * 24 * 3600000).toISOString(), now) === 'récente');
check('ancienne < 30j', freshnessBucket(new Date(now - 10 * 24 * 3600000).toISOString(), now) === 'ancienne');
check('périmée > 30j', freshnessBucket(new Date(now - 45 * 24 * 3600000).toISOString(), now) === 'périmée');

// Fusion sans doublons
const a = { ...n, id: 'r1', observedAt: new Date(now - 7200000).toISOString() };
const b = { ...n, id: 'r1', observedAt: new Date(now - 3600000).toISOString() };
check('fusion garde l’observation la plus récente', mergeReports([a], [b])[0].observedAt === b.observedAt);
check('fusion sans doublon d’id', mergeReports([a], [a]).length === 1);

// Export / import
const payload = serializeReports([n]);
const parsed = parseReportsPayload(payload, STORES);
check('export/import aller-retour', parsed.ok && parsed.reports.length === 1 && parsed.reports[0].productName === n.productName);
check('import d’un fichier étranger rejeté', !parseReportsPayload('{"foo":1}', STORES).ok);
check('import de JSON non PokéRadar rejeté', !parseReportsPayload(JSON.stringify({ app: 'autre', reports: [] }), STORES).ok);
const bad = parseReportsPayload(serializeReports([{ ...n, storeId: 'inconnu' }]), STORES);
check('signalement invalide rejeté à l’import, sans tout casser', bad.ok === false || (bad.reports && bad.reports.length === 0));

// Filtres
const list = [
  { ...n, id: 'x1', storeId: 'gamecash-clermont', status: 'en-rayon', observedAt: new Date(now - 3600000).toISOString() },
  { ...n, id: 'x2', storeId: 'smyths-clermont', status: 'rupture', observedAt: new Date(now - 10 * 24 * 3600000).toISOString() }
];
check('filtre par magasin', filterReports(list, { storeId: 'smyths-clermont' }).length === 1);
check('filtre par état', filterReports(list, { status: 'rupture' }).length === 1);
check('filtre par fraîcheur', filterReports(list, { bucket: 'fraîche' }).length === 1);
check('sans filtre, tout', filterReports(list).length === 2);

// Exhaustivité des états
check('4 états observables déclarés', STATUSES.length === 4);

console.log(`\n${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
