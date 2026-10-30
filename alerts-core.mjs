/* Moteur d'alertes — fonctions pures, testables hors navigateur.
   Compare deux rapports du calendrier et produit des alertes explicites.
   Règle : une alerte ne naît que d'un changement réellement observé. */

const BLOCKED = /request unsuccessful|incapsula|captcha|access denied|pardon our interruption/i;

export function isBlockedRecord(record) {
  if (!record) return false;
  return BLOCKED.test(String(record.name || ''));
}

export function filterRecords(report) {
  const records = (report && Array.isArray(report.records)) ? report.records : [];
  const live = [];
  const blocked = [];
  for (const r of records) {
    if (BLOCKED.test(String(r.name || ''))) blocked.push(r);
    else if (r && r.lastFetchOk !== false) live.push(r);
  }
  return { live, blocked };
}

export function diffCalendar(previous, current) {
  const alerts = [];
  if (!current) return alerts;
  const prevMap = new Map((previous && Array.isArray(previous.records) ? previous.records : []).map(r => [r.url, r]));
  const { live, blocked } = filterRecords(current);
  for (const r of blocked) {
    alerts.push({ key: `blocked:${r.url}`, type: 'blocked', name: 'Une page officielle est bloquée à la lecture', detail: 'La collecte n’a pas pu relire une source ; aucune donnée n’a été inventée.', at: current.checkedAt });
  }
  for (const r of live) {
    const before = prevMap.get(r.url);
    if (!before) {
      if (r.date || r.quarter) {
        alerts.push({ key: `new:${r.url}`, type: 'new', name: r.name, detail: `Nouvelle annonce détectée : ${r.date || r.quarter}`, at: current.checkedAt });
      } else {
        alerts.push({ key: `new:${r.url}`, type: 'new', name: r.name, detail: 'Nouvelle page suivie, date pas encore extraite.', at: current.checkedAt });
      }
      continue;
    }
    if ((before.date || null) !== (r.date || null) && (r.date || before.date)) {
      alerts.push({ key: `date:${r.url}:${r.date || 'none'}`, type: 'change', name: r.name, detail: before.date ? `Date passée de ${before.date} à ${r.date || 'non extraite'}` : `Date extraite : ${r.date}`, at: current.checkedAt });
    }
    if ((before.quarter || null) !== (r.quarter || null) && (r.quarter || before.quarter)) {
      alerts.push({ key: `quarter:${r.url}:${r.quarter || 'none'}`, type: 'change', name: r.name, detail: `Trimestre mis à jour : ${before.quarter || 'inconnu'} → ${r.quarter || 'inconnu'}`, at: current.checkedAt });
    }
    if (before.status === 'exact' && r.status === 'conflict') {
      alerts.push({ key: `conflict:${r.url}`, type: 'conflict', name: r.name, detail: 'Dates contradictoires détectées sur cette page : à vérifier manuellement.', at: current.checkedAt });
    }
  }
  return alerts;
}

export function applyPrefs(alerts, prefs) {
  if (!prefs || prefs.calendar === false) return [];
  return alerts.filter(a => a.type !== 'blocked' || prefs.calendar !== false);
}

export function mergeJournal(journal, alerts) {
  const existing = new Set((journal || []).map(e => e.key + '|' + (e.detail || '')));
  const entries = (journal || []).slice();
  for (const a of alerts) {
    const k = a.key + '|' + a.detail;
    if (existing.has(k)) continue;
    existing.add(k);
    entries.unshift({ key: a.key, type: a.type, name: a.name, detail: a.detail, at: a.at, read: false });
  }
  return entries.slice(0, 100);
}

export function describeAlert(a) {
  const icons = { new: 'NOUVEAU', change: 'CHANGEMENT', conflict: 'CONFLIT', blocked: 'SOURCE BLOQUÉE' };
  return `[${icons[a.type] || 'INFO'}] ${a.name} — ${a.detail}`;
}
