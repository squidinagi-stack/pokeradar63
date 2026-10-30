import { diffCalendar, applyPrefs, mergeJournal, filterRecords, isBlockedRecord, describeAlert } from '../alerts-core.mjs';

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('ok  -', name); } else { fail++; console.error('FAIL -', name); } }

const base = { checkedAt: '2026-10-30T05:00:00Z', records: [], history: [], errors: [] };
const rec = (over = {}) => ({ id: 'x1', name: 'Extension Méga-Évolution – Règne Delta', url: 'https://www.pokemon.com/fr/actualites/a', kind: 'extension', status: 'exact', date: '2026-11-06', quarter: null, proof: ['disponible le 6 novembre 2026'], lastFetchOk: true, diagnostic: 'Date explicite trouvée', checkedAt: '2026-10-30T05:00:00Z', ...over });

// 1. Détection d'une page de blocage Incapsula
check('fiche Incapsula rejetée des annonces', filterRecords({ ...base, records: [rec({ name: 'Request unsuccessful. Incapsula incident ID: 2108', status: 'unknown', date: null })] }).live.length === 0);
check('fiche Incapsula classée comme source bloquée', filterRecords({ ...base, records: [rec({ name: 'Request unsuccessful. Incapsula incident ID: 2108' })] }).blocked.length === 1);
check('isBlockedRecord reconnaît Incapsula', isBlockedRecord(rec({ name: 'Request unsuccessful. Incapsula incident ID: 9' })) === true);

// 2. Première collecte : la fiche valide devient une alerte "nouvelle annonce"
const first = diffCalendar(null, { ...base, records: [rec()] });
check('nouvelle annonce détectée à la première collecte', first.length === 1 && first[0].type === 'new');
check('détail de l’alerte contient la date extraite', first[0].detail.includes('2026-11-06'));

// 3. Pas d'alerte si rien ne change
const snap = { records: [rec()], checkedAt: base.checkedAt };
check('aucune alerte quand rien ne change', diffCalendar(snap, { ...base, records: [rec()] }).length === 0);

// 4. Changement de date détecté
const moved = diffCalendar(snap, { ...base, records: [rec({ date: '2026-11-27' })] });
check('report de date détecté', moved.length === 1 && moved[0].type === 'change');
check('détail du report mentionne l’ancienne et la nouvelle date', moved[0].detail.includes('2026-11-06') && moved[0].detail.includes('2026-11-27'));

// 5. Date qui apparaît après une lecture sans date
const gained = diffCalendar({ records: [rec({ date: null, status: 'unknown' })] }, { ...base, records: [rec()] });
check('date nouvellement extraite détectée', gained.length === 1 && gained[0].detail.includes('2026-11-06'));

// 6. Conflit de dates détecté
const conflict = diffCalendar(snap, { ...base, records: [rec({ status: 'conflict' })] });
check('conflit de dates détecté', conflict.length === 1 && conflict[0].type === 'conflict');

// 7. Blocage après une lecture réussie
const blocked = diffCalendar(snap, { ...base, records: [rec({ name: 'Request unsuccessful. Incapsula incident ID: 210800057' })] });
check('blocage source signalé comme alerte', blocked.some(a => a.type === 'blocked'));

// 8. Préférences : désactivation du calendrier supprime les alertes calendrier
check('prefs.calendar=false bloque les alertes', applyPrefs(first, { calendar: false }).length === 0);
check('prefs absentes conservent les alertes', applyPrefs(first, {}).length === 1);

// 9. Journal : pas de doublon pour le même événement
const j1 = mergeJournal([], first);
const j2 = mergeJournal(j1, first);
check('journal sans doublon', j1.length === 1 && j2.length === 1);

// 10. Journal : événement différent ajouté en tête
const j3 = mergeJournal(j1, moved);
check('nouvel événement ajouté au journal', j3.length === 2 && j3[0].detail.includes('2026-11-27'));

// 11. describeAlert lisible
check('describeAlert produit un texte lisible', describeAlert(first[0]).startsWith('[NOUVEAU]'));

console.log(`\n${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
