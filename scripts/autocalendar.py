import json,re,time,hashlib,datetime,urllib.request,urllib.parse
from pathlib import Path
from html.parser import HTMLParser
BASE='https://www.pokemon.com'
INDEX=BASE+'/fr/jcc-pokemon/galerie-produits'
SEEDS=[BASE+'/fr/actualites/lextension-mega-evolution-regne-delta-du-jcc-pokemon-arrive-le-6-novembre-2026']
MONTHS={'janvier':1,'janv':1,'février':2,'févr':2,'mars':3,'avril':4,'avr':4,'mai':5,'juin':6,'juillet':7,'juil':7,'août':8,'septembre':9,'sept':9,'octobre':10,'oct':10,'novembre':11,'nov':11,'décembre':12,'déc':12}
class Text(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.skip=0;self.parts=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('script','style','noscript'):self.skip+=1
  if tag=='a' and a.get('href'):self.links.append((a['href'],' '.join(self.parts[-40:]).strip()))
 def handle_endtag(self,tag):
  if tag in ('script','style','noscript'):self.skip=max(0,self.skip-1)
 def handle_data(self,s):
  if not self.skip and s.strip():self.parts.append(s.strip())
def normalize(text):
 text=re.sub(r'\s+',' ',text)
 text=re.sub(r'(\d)\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv|févr|avr|juil|sept|oct|nov|déc)\.?\s*(\d{4})',r'\1 \2 \3',text,flags=re.I)
 return text
def date_from(match):
 day,month,year=match.group(1),match.group(2).lower(),match.group(3)
 try:return datetime.date(int(year),MONTHS[month],int(day)).isoformat()
 except (ValueError,KeyError):return None
def extract(html,url):
 p=Text();p.feed(html);title=' '.join(p.parts[:12]);text=normalize(' '.join(p.parts))
 if not text or re.search(r'captcha|access denied|pardon our interruption|verify you are human',title+' '+text,re.I):raise ValueError('Page inaccessible ou structure non reconnue')
 main=re.split(r'Autres articles',text,flags=re.I)[0]
 patterns=[
  r'(?:disponible(?:s)?\s+(?:le|à partir du)|date de sortie\s*:?\s*|sortira\s+le|arrive(?:nt)?\s+le|sortie\s+(?:prévue\s+)?le)\s*(\d{1,2})\s+('+ '|'.join(MONTHS)+r')\.?\s+(20\d{2})',
  r'(\d{1,2})\s+('+ '|'.join(MONTHS)+r')\.?\s+(20\d{2})\s*\.?\s*(?:disponible|date de sortie|sortie)']
 found=[]
 for pattern in patterns:
  for m in re.finditer(pattern,main,re.I):
   iso=date_from(m)
   if iso:found.append({'date':iso,'quote':m.group(0)[:220]})
 unique={}
 for x in found:unique.setdefault(x['date'],x['quote'])
 dates=list(unique)
 if len(dates)>1:status='conflict';date=dates[0]
 elif len(dates)==1:status='exact';date=dates[0]
 else:status='unknown';date=None
 return {'id':hashlib.sha256(url.encode()).hexdigest()[:16],'name':title[:180] or url,'url':url,'kind':'extension' if '/actualites/' in url else 'product','status':status,'date':date,'quarter':None,'proof':[unique[d] for d in dates],'lastFetchOk':True,'diagnostic':'Date explicite trouvée' if dates else 'Aucune formulation exploitable trouvée'}
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
 path=folder/'calendar.json';old=json.loads(path.read_text()) if path.exists() else {'records':[],'history':[]}
 records={x['url']:x for x in old.get('records',[])};history=old.get('history',[]);errors=[]
 for url in SEEDS:
  before=records.get(url)
  try:
   rec=extract(fetch(url),url);rec['checkedAt']=now
   if before:
    prev={k:before.get(k) for k in ('status','date','quarter')};cur={k:rec.get(k) for k in ('status','date','quarter')}
    if prev!=cur:history.append({'at':now,'url':url,'name':rec['name'],'before':prev,'after':cur,'proof':rec['proof']})
   records[url]=rec
  except Exception as e:
   errors.append({'url':url,'error':str(e)[:240]})
   if before:records[url]={**before,'lastFetchOk':False,'lastAttemptAt':now}
 report={'checkedAt':now,'indexOk':True,'discoveredCount':0,'attempted':len(SEEDS),'pendingCount':0,'records':list(records.values()),'history':history[-200:],'errors':errors,'scope':'Pages officielles FR uniquement. Pas de stock, pas de fournisseur prix, pas de revendeur. Articles extension et fiches produits distincts.'}
 (folder/'calendar.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 (folder/'calendar-data.js').write_text('window.PR_CALENDAR='+json.dumps(report,ensure_ascii=True).replace('<',chr(92)+'u003c')+';'+chr(10))
 print(json.dumps({'records':len(records),'dates':[x.get('date') for x in records.values()],'errors':len(errors)}))
 if not any(x.get('lastFetchOk') and x.get('date') for x in records.values()):raise SystemExit(1)
if __name__=='__main__':run()
