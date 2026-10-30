/* Validation des données magasins : chaque fiche doit être sourcée, dans le 63,
   avec un niveau de vérification connu et des horaires bien formés. */
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('ok  -', name); } else { fail++; console.error('FAIL -', name); } };

const src = readFileSync('magasins/stores-data.js', 'utf8');
const data = new Function('window', src + '\nreturn window.PR_STORES;')({});

check('au moins 10 boutiques réelles', data.stores.length >= 10);
check('aucune fiche de démonstration restante', !data.stores.some(s => String(s.id).startsWith('demo-')));
for (const s of data.stores) {
  check(`fiche ${s.id} : nom présent`, !!s.name);
  check(`fiche ${s.id} : code postal du 63`, /^63\d{3}$/.test(s.postalCode));
  check(`fiche ${s.id} : adresse non vide`, !!s.address && !/à compléter/i.test(s.address));
  check(`fiche ${s.id} : niveau de vérification connu`, ['official', 'aggregator', 'community'].includes(s.verification));
  check(`fiche ${s.id} : source identifiée`, !!s.sourceKey && !!data.sources[s.sourceKey]);
  check(`fiche ${s.id} : date de vérification présente`, !!s.lastChecked);
  check(`fiche ${s.id} : services renseignés`, Array.isArray(s.services) && s.services.length > 0);
  for (const [k, v] of Object.entries(s.hours || {})) {
    check(`fiche ${s.id} horaire ${k} bien formé`, v === 'Fermé' || /^\d{2}:\d{2}[–-]\d{2}:\d{2}$/.test(v));
  }
  if (s.phone) check(`fiche ${s.id} : téléphone plausible`, /^\+33\d{9}$/.test(s.phone));
}
check('chaque source déclarée est utilisée', Object.keys(data.sources).every(k => data.stores.some(s => s.sourceKey === k)));
check('avertissement stock présent', /stock/i.test(data.disclaimer));

console.log(`\n${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
