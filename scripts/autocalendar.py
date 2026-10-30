import json,re,time,hashlib,datetime,urllib.request,urllib.parse
from pathlib import Path
from html.parser import HTMLParser
BASE='https://www.pokemon.com'
INDEX=BASE+'/fr/jcc-pokemon/galerie-produits'
SEEDS=[INDEX+'/collections-ultra-premium-30-anniversaire-journee-et-soiree',INDEX+'/collection-premium-metamorph-30-anniversaire',INDEX+'/collection-avec-figurine-30-anniversaire',INDEX+'/deck-combat-30-anniversaire-mentali-ex-et-deck-combat-30-anniversaire-noctali-ex',BASE+'/fr/actualites/lextension-mega-evolution-regne-delta-du-jcc-pokemon-arrive-le-6-novembre-2026']
MONTHS={'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}
class Page(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.skip=0;self.in_h1=False;self.seen=False;self.title=[];self.text=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('script','style'):self.skip+=1
  if tag=='h1':self.in_h1=True;self.seen=True
  if tag=='a' and a.get('href'):self.links.append(a['href'])
 def handle_endtag(self,tag):
  if tag in ('script','style'):self.skip=max(0,self.skip-1)
  if tag=='h1':self.in_h1=False
 def handle_data(self,s):
  if not self.skip:
   if self.in_h1:self.title.append(s)
   if self.seen:self.text.append(s)
def extract(html,url):
 p=Page();p.feed(html);title=' '.join(' '.join(p.title).split());text=' '.join(' '.join(p.text).split())[:1800]
 if not title or re.search(r'captcha|access denied|pardon our interruption|verify you are human',title+' '+text,re.I):raise ValueError('Page inaccessible ou structure non reconnue')
 pattern=r'(?:date de sortie\s*:?|disponibles?\s+(?:à partir du|le)|sortira\s+le|arrive\s+le|sortie\s+(?:prévue\s+)?le)\s*(\d{1,2})\s+('+ '|'.join(MONTHS)+r')\s+(20\d{2})'
 matches=list(re.finditer(pattern,text,re.I));dates={};
 for m in matches:
  try:d=datetime.date(int(m[3]),MONTHS[m[2].lower()],int(m[1])).isoformat();dates[d]=m[0]
  except ValueError:pass
 q=re.search(r'(?:disponibles?|date de sortie\s*:?)\s*(?:le\s+)?([1-4])(?:er|e|ᵉ)?\s+trimestre\s+(20\d{2})',text,re.I)
 status='conflict' if len(dates)>1 else 'exact' if len(dates)==1 else 'quarter' if q else 'unknown'
 return {'id':hashlib.sha256(url.encode()).hexdigest()[:16],'name':title,'url':url,'kind':'extension' if '/actualites/' in url else 'product','status':status,'date':next(iter(dates)) if status=='exact' else None,'quarter':f'{q[2]}-Q{q[1]}' if q else None,'proof':list(dates.values()) if dates else [q[0]] if q else [],'lastFetchOk':True}
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  u=urllib.parse.urlparse(newurl)
  if u.scheme!='https' or u.hostname!='www.pokemon.com':raise ValueError('Redirection externe refusée')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def fetch(url):
 u=urllib.parse.urlparse(url)
 if u.scheme!='https' or u.hostname!='www.pokemon.com':raise ValueError('Source non autorisée')
 req=urllib.request.Request(url,headers={'User-Agent':'PokeRadar63-Calendar/1.0','Accept':'text/html'})
 with urllib.request.build_opener(SafeRedirect()).open(req,timeout=15) as response:
  if response.headers.get_content_type()!='text/html':raise ValueError('Contenu non HTML')
  raw=response.read(1500001)
  if len(raw)>1500000:raise ValueError('Page trop volumineuse')
  return raw.decode('utf-8',errors='replace')
def run():
 folder=Path('radar-auto');folder.mkdir(exist_ok=True);now=datetime.datetime.now(datetime.timezone.utc).isoformat()
 old={'records':[],'history':[]}
 path=folder/'calendar.json'
 if path.exists():old=json.loads(path.read_text())
 records={x['url']:x for x in old.get('records',[])};errors=[];discovered=[]
 try:
  page=Page();page.feed(fetch(INDEX))
  for href in page.links:
   url=urllib.parse.urljoin(BASE,href).split('#')[0].split('?')[0];parsed=urllib.parse.urlparse(url)
   if parsed.hostname=='www.pokemon.com' and parsed.path.startswith('/fr/jcc-pokemon/galerie-produits/') and url not in discovered:discovered.append(url)
 except Exception as e:errors.append({'url':INDEX,'error':str(e)[:180]})
 queue=list(dict.fromkeys(SEEDS+discovered+list(records)))
 queue.sort(key=lambda url:records.get(url,{}).get('checkedAt',''))
 history=old.get('history',[])
 for url in queue[:20]:
  before=records.get(url)
  try:
   rec=extract(fetch(url),url);rec['checkedAt']=now
   if before:
    previous={k:before.get(k) for k in ('status','date','quarter')};current={k:rec.get(k) for k in ('status','date','quarter')}
    if previous!=current:history.append({'at':now,'url':url,'name':rec['name'],'before':previous,'after':current,'proof':rec['proof']})
   records[url]=rec
  except Exception as e:
   errors.append({'url':url,'error':str(e)[:180]})
   if before:records[url]={**before,'lastFetchOk':False,'lastAttemptAt':now}
  time.sleep(1)
 report={'checkedAt':now,'indexOk':not any(e['url']==INDEX for e in errors),'discoveredCount':len(discovered),'attempted':min(20,len(queue)),'pendingCount':max(0,len(queue)-20),'records':list(records.values()),'history':history[-200:],'errors':errors,'scope':'Pages officielles FR uniquement. Pas de stock, pas de fournisseur prix, pas de revendeur. Articles extension et fiches produits distincts.'}
 text=json.dumps(report,ensure_ascii=False,indent=2);path.write_text(text);(folder/'calendar-data.js').write_text('window.PR_CALENDAR='+json.dumps(report,ensure_ascii=True).replace('<',chr(92)+'u003c')+';'+chr(10))
 print(json.dumps({'attempted':report['attempted'],'errors':len(errors),'records':len(records),'pending':report['pendingCount']}))
 if not any(x.get('checkedAt')==now and x.get('lastFetchOk') for x in records.values()):raise SystemExit(1)
if __name__=='__main__':run()
