import unittest
from autocalendar import extract,Page
URL='https://www.pokemon.com/fr/jcc-pokemon/galerie-produits/test'
class CalendarTests(unittest.TestCase):
 def get(self,text):return extract('<h1>Produit test</h1><p>'+text+'</p>',URL)
 def test_date(self):self.assertEqual(self.get('Date de sortie : 6 novembre 2026')['date'],'2026-11-06')
 def test_delay(self):self.assertEqual(self.get('Disponible le 27 novembre 2026')['date'],'2026-11-27')
 def test_quarter(self):self.assertEqual(self.get('Disponibles le 4e trimestre 2026')['quarter'],'2026-Q4')
 def test_no_invented_day(self):self.assertIsNone(self.get('Disponibles le 4e trimestre 2026')['date'])
 def test_publication_not_release(self):self.assertEqual(self.get('Publié le 6 novembre 2026')['status'],'unknown')
 def test_dispatch_not_release(self):self.assertEqual(self.get('Expédition le 6 novembre 2026')['status'],'unknown')
 def test_bad_date(self):self.assertIsNone(self.get('Date de sortie : 30 février 2026')['date'])
 def test_conflict(self):self.assertEqual(self.get('Disponible le 6 novembre 2026. Disponible le 27 novembre 2026')['status'],'conflict')
 def test_title_date(self):self.assertEqual(extract('<h1>Extension arrive le 6 novembre 2026</h1>',URL)['date'],'2026-11-06')
 def test_captcha(self):
  with self.assertRaises(ValueError):extract('<h1>Pardon Our Interruption</h1>',URL)
 def test_scripts(self):self.assertEqual(self.get('<script>Date de sortie : 6 novembre 2026</script>Inconnue')['status'],'unknown')
 def test_links(self):
  p=Page();p.feed('<a href="/fr/jcc-pokemon/galerie-produits/test">Lien</a>');self.assertEqual(len(p.links),1)
if __name__=='__main__':unittest.main()
