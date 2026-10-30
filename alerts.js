/* Interface navigateur du moteur d'alertes (module ES).
   Compare le rapport calendrier publié au dernier état connu (localStorage),
   met à jour le journal et envoie une notification locale si autorisée.
   Aucune donnée n'est envoyée, aucune alerte n'est inventée. */
import { diffCalendar, applyPrefs, mergeJournal, describeAlert } from './alerts-core.mjs';

const $ = id => document.getElementById(id);
const SNAPSHOT = 'pokeradar63.snapshot.v1';
const JOURNAL = 'pokeradar63.journal.v1';
const PREFS = 'pokeradar63.prefs';
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } };

const report = window.PR_CALENDAR;
const journalEl = $('journal');
if (!report) {
  if (journalEl) journalEl.innerHTML = '<p class="muted">Rapport calendrier indisponible sur cette page.</p>';
} else {
  const previous = read(SNAPSHOT, null);
  const prefs = read(PREFS, { calendar: true });
  const alerts = applyPrefs(diffCalendar(previous, report), prefs);
  const journal = mergeJournal(read(JOURNAL, []), alerts);
  localStorage.setItem(SNAPSHOT, JSON.stringify({ records: report.records, checkedAt: report.checkedAt }));
  localStorage.setItem(JOURNAL, JSON.stringify(journal));

  const unread = journal.filter(e => !e.read).length;
  if (journalEl) {
    const head = document.createElement('p');
    head.className = 'muted';
    head.textContent = journal.length
      ? journal.length + ' alerte(s) dans le journal · ' + unread + ' non lue(s)'
      : 'Aucune alerte pour l’instant. Le journal se remplit dès qu’un changement réel est observé.';
    journalEl.append(head);
    for (const e of journal.slice(0, 12)) {
      const a = document.createElement('article');
      a.className = e.read ? 'alert read' : 'alert';
      const t = document.createElement('strong');
      t.textContent = ({ new: 'NOUVEAU', change: 'CHANGEMENT', conflict: 'CONFLIT', blocked: 'SOURCE BLOQUÉE' }[e.type] || 'INFO');
      a.append(t, document.createElement('h3')).textContent = e.name;
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = e.detail;
      a.append(p);
      const d = document.createElement('p');
      d.className = 'muted';
      d.textContent = new Date(e.at || report.checkedAt).toLocaleString('fr-FR');
      a.append(d);
      journalEl.append(a);
    }
    const clear = document.createElement('button');
    clear.textContent = 'Tout marquer comme lu';
    clear.onclick = () => {
      const j = read(JOURNAL, []).map(x => ({ ...x, read: true }));
      localStorage.setItem(JOURNAL, JSON.stringify(j));
      location.reload();
    };
    journalEl.append(clear);
  }

  const seen = new Set(read(JOURNAL, []).map(e => e.key + '|' + e.detail));
  const fresh = alerts.filter(a => !seen.has(a.key + '|' + a.detail));
  if (fresh.length && 'Notification' in window && Notification.permission === 'granted') {
    for (const a of fresh.slice(0, 3)) new Notification('PokéRadar 63', { body: describeAlert(a) });
  }
}
window.PR_ALERTS_READY = true;
