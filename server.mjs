import http from 'node:http';
import {readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, statSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import path from 'node:path';
import {migrateForm, migrateMembers, validateAnswers, validateDefinition, closedReason, sectionPath, errorMessage, activeLogo, safeNavigation} from './public/forms-core.js';

const dataDir = path.resolve(process.env.DATA_DIR || 'data');
mkdirSync(path.join(dataDir,'uploads'),{recursive:true});
const db = new DatabaseSync(path.join(dataDir,'club.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY, value TEXT);
 CREATE TABLE IF NOT EXISTS responses (id INTEGER PRIMARY KEY, form TEXT, created TEXT, value TEXT);
 CREATE TABLE IF NOT EXISTS visits (created TEXT, page TEXT);
 CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, value TEXT, updated TEXT);
 CREATE INDEX IF NOT EXISTS response_form ON responses(form); CREATE INDEX IF NOT EXISTS visit_created ON visits(created);`);
if (!db.prepare('PRAGMA table_info(responses)').all().some(c=>c.name==='snapshot')) db.exec('ALTER TABLE responses ADD COLUMN snapshot TEXT');
const initial = {forms:[], announcements:[], members:[], logo:'', facultyLogo:'', temporaryLogo:'', logoUntil:'', revision:0};
function getSite(){const stored=db.prepare('SELECT value FROM content WHERE id=?').get('site');const site={...initial,...(stored?JSON.parse(stored.value):{})};site.forms=site.forms.map(migrateForm);site.members=migrateMembers(site.members);for(const [key,name] of [['logo','logo-club.png'],['facultyLogo','logo-fsbm.png']])if(existsSync(path.resolve('public/assets',name)))site[key]='/assets/'+name;return site;}
// Preserve historical labels before the first edit after upgrading the application.
for (const row of db.prepare('SELECT id,form FROM responses WHERE snapshot IS NULL').all()) {
 const form=getSite().forms.find(f=>f.id===row.form);db.prepare('UPDATE responses SET snapshot=? WHERE id=?').run(JSON.stringify(form || {title:'Formulaire archivé',questions:[],sections:[]}),row.id);
}
const sessions=new Map(), attempts=new Map();
const password=process.env.ADMIN_PASSWORD;
if(!password) console.warn('Admin login disabled: set ADMIN_PASSWORD before starting.');
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16_000_000)throw Error('Requête trop volumineuse.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
function token(req){return (req.headers.cookie||'').match(/(?:^|; )session=([^;]+)/)?.[1];}
function authorized(req){return sessions.get(token(req))>Date.now();}
function formCount(id){return db.prepare('SELECT count(*) n FROM responses WHERE form=?').get(id).n;}
const fileExt = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf','text/plain':'txt'};
function fileBuffer(file){
 if(typeof file.data!=='string'||!file.data.length||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))throw Error('Contenu du fichier invalide.');
 const b=Buffer.from(file.data,'base64');if(b.length!==file.size)throw Error('Taille du fichier incorrecte.');
 const valid={'image/png':()=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'image/jpeg':()=>b[0]===255&&b[1]===216&&b[2]===255, 'image/webp':()=>b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP', 'application/pdf':()=>b.toString('ascii',0,5)==='%PDF-', 'text/plain':()=>!b.includes(0)&&!b.toString('utf8').includes('\ufffd')};
 if(!valid[file.type]?.())throw Error('Le contenu ne correspond pas au format du fichier.');return b;
}
function stats(){
 const week=new Date();week.setUTCHours(0,0,0,0);week.setUTCDate(week.getUTCDate()-6);
 return {visits:db.prepare('SELECT substr(created,1,10) day,count(*) count FROM visits WHERE created>=? GROUP BY day').all(week.toISOString()),
 responses:db.prepare('SELECT * FROM responses ORDER BY id DESC').all().map(r=>({...r,value:JSON.parse(r.value),snapshot:JSON.parse(r.snapshot||'{}')})),
 formVisits:db.prepare("SELECT page,count(*) count FROM visits WHERE page LIKE '/forms/%' GROUP BY page").all()};
}
const mime={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.html':'text/html; charset=utf-8'};
function serve(res,file,origin=''){if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');let content=readFileSync(file);if(origin&&path.extname(file)==='.html')content=content.toString().replace('content="/assets/social.png"',`content="${origin}/assets/social.png"`);res.end(content);}
export function createServer(admin=false){return http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'), p=url.pathname;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'");
 if(admin && p.startsWith('/api/') && !['GET','HEAD'].includes(req.method) && req.headers.origin && new URL(req.headers.origin).host!==req.headers.host) return json(res,403,{error:'Origine refusée.'});
 if(p==='/api/login'&&admin&&req.method==='POST'){
  const ip=req.socket.remoteAddress, attempt=attempts.get(ip);if(attempt?.until>Date.now()&&attempt.count>=10)return json(res,429,{error:'Trop de tentatives. Réessayez dans 15 minutes.'});
  const b=await body(req),a=Buffer.from(String(b.password||'')),z=Buffer.from(password||'');
  if(!password||a.length!==z.length||!timingSafeEqual(a,z)){const next=attempt?.until>Date.now()?attempt:{count:0,until:Date.now()+900000};next.count++;attempts.set(ip,next);return json(res,401,{error:'Mot de passe incorrect.'});}
  attempts.delete(ip);const value=randomBytes(32).toString('hex');sessions.set(value,Date.now()+8*3600000);
  res.setHeader('Set-Cookie',`session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='1'?'; Secure':''}`);return json(res,200,{ok:true});
 }
 if(admin&&p.startsWith('/api/')&&!authorized(req))return json(res,401,{error:'Connexion requise.'});
 if(p==='/api/logout'&&admin&&req.method==='POST'){sessions.delete(token(req));res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
 if(p==='/api/site'&&req.method==='GET'){
  const site=getSite();if(!admin){site.forms=site.forms.filter(f=>f.published).map(f=>({...f,responseCount:formCount(f.id),closed:closedReason(f,formCount(f.id))}));delete site.revision;}
  return json(res,200,site);
 }
 if(p==='/api/site'&&admin&&req.method==='PUT'){
  const b=await body(req),old=getSite();for(const key of ['forms','announcements','members'])if(!Array.isArray(b[key]))throw Error('Contenu invalide.');
  if(b.revision!==undefined&&b.revision!==old.revision)return json(res,409,{error:'Le contenu a changé dans un autre onglet. Rechargez avant de sauvegarder.'});
  b.forms=b.forms.map(f=>validateDefinition(migrateForm(f),!!f.published));
  b.members=migrateMembers(b.members);
  if(b.members.filter(m=>m.isPresident).length>1)throw Error('Un seul membre peut être président du club.');
  for(const m of b.members){if(!m.firstName?.trim()||!Number.isFinite(m.displayOrder)||!Number.isFinite(m.groupOrder))throw Error('Nom ou ordre du membre invalide.');for(const key of ['instagram','linkedin'])if(m[key]&&!/^https:\/\/[^\s<>"']+$/i.test(m[key]))throw Error('Les liens des membres doivent commencer par https://.');}
  for(const key of ['instagram','facebook','map'])if(b.footer?.[key]&&!/^https:\/\/[^\s<>"']+$/i.test(b.footer[key]))throw Error('Lien du pied de page invalide : '+key);
  if(b.footer?.email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(b.footer.email))throw Error('Adresse e-mail invalide.');
  if(b.footer?.whatsapp&&!/^\+?\d{7,15}$/.test(b.footer.whatsapp))throw Error('Numéro WhatsApp : chiffres avec indicatif international.');
  if(b.footer?.links&&(!Array.isArray(b.footer.links)||b.footer.links.length>12||b.footer.links.some(link=>!link.label?.trim()||!safeNavigation(link.url))))throw Error('Renseignez le libellé et la destination de chaque lien (12 maximum).');
  if(new Set(b.forms.map(f=>f.id)).size!==b.forms.length)throw Error('Formulaires dupliqués.');
  for(const f of old.forms)db.prepare('UPDATE responses SET snapshot=? WHERE form=? AND snapshot IS NULL').run(JSON.stringify(f),f.id);
  b.revision=old.revision+1;db.prepare('INSERT OR REPLACE INTO content VALUES (?,?)').run('site',JSON.stringify(b));return json(res,200,{ok:true,revision:b.revision});
 }
 if(p==='/api/drafts'&&admin&&req.method==='GET')return json(res,200,db.prepare('SELECT * FROM drafts ORDER BY updated DESC').all().map(r=>({id:r.id,updated:r.updated,value:JSON.parse(r.value)})));
 if(p.startsWith('/api/drafts/')&&admin){const id=p.split('/').pop();if(req.method==='PUT'){const f=migrateForm(await body(req));if(f.id!==id)throw Error('Identifiant invalide.');validateDefinition(f,false);db.prepare('INSERT OR REPLACE INTO drafts VALUES (?,?,?)').run(id,JSON.stringify(f),new Date().toISOString());return json(res,200,{ok:true});}if(req.method==='DELETE'){db.prepare('DELETE FROM drafts WHERE id=?').run(id);return json(res,200,{ok:true});}}
 if(p==='/api/stats'&&admin&&req.method==='GET')return json(res,200,stats());
 if(/^\/api\/responses\/\d+$/.test(p)&&admin&&req.method==='DELETE'){
  const id=Number(p.split('/').pop()),row=db.prepare('SELECT value FROM responses WHERE id=?').get(id);
  if(!row)return json(res,404,{error:'Réponse introuvable.'});
  for(const v of Object.values(JSON.parse(row.value))){if(v?.fileId&&/^[a-f0-9]{32}\.(png|jpg|webp|pdf|txt)$/.test(v.fileId)){try{unlinkSync(path.join(dataDir,'uploads',v.fileId));}catch{}}}
  db.prepare('DELETE FROM responses WHERE id=?').run(id);return json(res,200,{ok:true});
 }
 if(p.startsWith('/api/files/')&&admin&&req.method==='GET'){
  const id=p.split('/').pop();if(!/^[a-f0-9]{32}\.(png|jpg|webp|pdf|txt)$/.test(id))return json(res,404,{error:'Fichier introuvable.'});
  res.setHeader('Content-Disposition',`attachment; filename="${id}"`);res.setHeader('Content-Type','application/octet-stream');const file=path.join(dataDir,'uploads',id);if(!existsSync(file))return json(res,404,{error:'Fichier introuvable.'});return res.end(readFileSync(file));
 }
 if(p==='/api/visit'&&!admin&&req.method==='POST'){const b=await body(req);db.prepare('INSERT INTO visits VALUES (?,?)').run(new Date().toISOString(),String(b.page||'/').slice(0,200));return json(res,200,{ok:true});}
 if(p==='/api/respond'&&!admin&&req.method==='POST'){
  const b=await body(req),f=getSite().forms.find(f=>f.id===b.form&&f.published),lang=b.lang==='ar'?'ar':'fr';
  if(!f)return json(res,404,{error:lang==='ar'?'الاستمارة غير متاحة.':'Formulaire introuvable.'});
  if(closedReason(f,formCount(f.id)))return json(res,409,{error:lang==='ar'?'تم إغلاق التسجيل.':'Ce formulaire n’accepte plus de réponses.',code:'closed'});
  if(!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers))throw Error('Réponses invalides.');
  const errors=validateAnswers(f,b.answers);
  const visible=new Set(sectionPath(f,b.answers));const answers={},files=[];
  for(const q of f.questions.filter(q=>visible.has(q.section))){
   const v=b.answers[q.id];if(v===undefined)continue;
   if(q.type==='file'&&v&&!errors[q.id]){try{files.push({q,file:v,buffer:fileBuffer(v)});}catch{errors[q.id]='file';}}
   else answers[q.id]=v;
  }
  if(Object.keys(errors).length)return json(res,422,{error:lang==='ar'?'يرجى مراجعة الإجابات المحددة.':'Vérifiez les réponses indiquées.',errors:Object.fromEntries(Object.entries(errors).map(([id,code])=>[id,errorMessage(code,lang)]))});
  const written=[];
  try{
   db.exec('BEGIN IMMEDIATE');
   if(closedReason(f,formCount(f.id))){db.exec('ROLLBACK');return json(res,409,{error:lang==='ar'?'تم إغلاق التسجيل.':'Ce formulaire est complet.',code:'closed'});}
   for(const {q,file,buffer} of files){const fileId=randomBytes(16).toString('hex')+'.'+fileExt[file.type];writeFileSync(path.join(dataDir,'uploads',fileId),buffer,{flag:'wx',mode:0o600});written.push(fileId);answers[q.id]={fileId,name:path.basename(file.name).replace(/[\r\n]/g,''),type:file.type,size:file.size};}
   const result=db.prepare('INSERT INTO responses(form,created,value,snapshot) VALUES (?,?,?,?)').run(f.id,new Date().toISOString(),JSON.stringify(answers),JSON.stringify(f));db.exec('COMMIT');return json(res,201,{ok:true,id:Number(result.lastInsertRowid)});
  }catch(err){db.exec('ROLLBACK');for(const name of written)try{unlinkSync(path.join(dataDir,'uploads',name));}catch{}throw err;}
 }
 if(p.startsWith('/api/'))return json(res,404,{error:'Not found'});
 if(p==='/brand-logo'){const logo=activeLogo(getSite());const match=logo.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(match){res.setHeader('Content-Type',match[1]);return res.end(Buffer.from(match[2],'base64'));}if(logo.startsWith('/assets/'))return serve(res,path.resolve('public','.'+logo));res.writeHead(204);return res.end();}
 const shared=p.startsWith('/shared/'),root=path.resolve(shared||p.startsWith('/assets/')?'public':admin?'admin':'public');
 let requested=shared?p.slice(7):p;
 if(requested==='/'||(!path.extname(requested)&&!shared))requested='/index.html';
 const file=path.resolve(root,'.'+decodeURIComponent(requested));if(!file.startsWith(root+path.sep))return json(res,404,{error:'Not found'});
 const host=String(req.headers.host||'');const protocol=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim()==='https'||process.env.COOKIE_SECURE==='1'?'https':'http';
 serve(res,file,!admin&&!shared&&/^[a-zA-Z0-9.:[\]-]+$/.test(host)?`${protocol}://${host}`:'');
 }catch(err){json(res,400,{error:err.message});}});}
createServer().listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Public site listening on port '+(process.env.PORT||3000)));
createServer(true).listen(Number(process.env.ADMIN_PORT||3001),'0.0.0.0',()=>console.log('Separate admin application listening on port '+(process.env.ADMIN_PORT||3001)));
