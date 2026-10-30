import unittest
import re
from autocalendar import extract,normalize,date_from
URL='https://www.pokemon.com/fr/test'
HTML='<h1>Extension</h1><p>Méga-Rayquaza-ex débarque, disponible le 6 nov. 2026.</p><h2>Autres articles</h2><p>Date de sortie :5 octobre 2026</p>'
class Tests(unittest.TestCase):
 def test_real_page_pattern(self):
  rec=extract(HTML,URL);self.assertEqual(rec['date'],'2026-11-06');self.assertEqual(rec['status'],'exact')
 def test_full_month(self):
  rec=extract('<h1>T</h1><p>Disponible le 6 novembre 2026.</p>',URL);self.assertEqual(rec['date'],'2026-11-06')
 def test_abbrev(self):
  rec=extract('<h1>T</h1><p>Date de sortie : 6 nov. 2026</p>',URL);self.assertEqual(rec['date'],'2026-11-06')
 def test_article_date_not_release(self):
  rec=extract('<h1>T</h1><p>20 août 2026</p>',URL);self.assertIsNone(rec['date'])
 def test_conflict(self):
  rec=extract('<h1>T</h1><p>Disponible le 6 novembre 2026. Disponible le 27 novembre 2026.</p>',URL);self.assertEqual(rec['status'],'conflict')
 def test_bad_date(self):
  self.assertIsNone(date_from(re.match(r'(\d{1,2})\s+(février)\s+(2026)','30 février 2026')))
 def test_normalize(self):self.assertIn('6 nov 2026',normalize('6  nov.  2026'))
 def test_captcha(self):
  with self.assertRaises(ValueError):extract('<h1>Pardon Our Interruption</h1>',URL)
 def test_diagnostic(self):
  rec=extract('<h1>T</h1><p>Aucune date.</p>',URL);self.assertEqual(rec['diagnostic'],'Aucune formulation exploitable trouvée')
if __name__=='__main__':unittest.main()
