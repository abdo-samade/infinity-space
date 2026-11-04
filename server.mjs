import http from 'node:http';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import path from 'node:path';
mkdirSync('data',{recursive:true});
const db=new DatabaseSync('data/club.sqlite');
db.exec(`CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY, value TEXT); CREATE TABLE IF NOT EXISTS responses (id INTEGER PRIMARY KEY, form TEXT, created TEXT, value TEXT); CREATE TABLE IF NOT EXISTS visits (created TEXT, page TEXT);`);
const initial={forms:[],announcements:[],members:[],logo:'',temporaryLogo:'',logoUntil:''};
const get=()=>JSON.parse(db.prepare('SELECT value FROM content WHERE id=?').get('site')?.value||JSON.stringify(initial));
const sessions=new Map();
const password=process.env.ADMIN_PASSWORD;
if(!password) console.warn('Admin login disabled: set ADMIN_PASSWORD before starting.');
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>8_000_000)throw Error('Request too large');}return JSON.parse(text||'{}');}
function authorized(req){const token=(req.headers.cookie||'').match(/(?:^|; )session=([^;]+)/)?.[1];return sessions.get(token)>Date.now();}
function createServer(admin=false){return http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');const p=url.pathname;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 if(p==='/api/login'&&admin&&req.method==='POST'){const b=await body(req);const a=Buffer.from(String(b.password||'')),z=Buffer.from(password||'');if(!password||a.length!==z.length||!timingSafeEqual(a,z))return json(res,401,{error:'Mot de passe incorrect'});const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/${process.env.COOKIE_SECURE==='1'?'; Secure':''}`);return json(res,200,{ok:true});}
 if(p==='/api/logout'&&admin){const token=(req.headers.cookie||'').match(/session=([^;]+)/)?.[1];sessions.delete(token);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
 if(p==='/api/site'&&req.method==='GET'){if(admin&&!authorized(req))return json(res,401,{error:'Connexion requise'});const site=get();if(!admin)site.forms=site.forms.filter(f=>f.published);return json(res,200,site);}
 if(p.startsWith('/api/')&&admin&&!authorized(req))return json(res,401,{error:'Connexion requise'});
 if(p==='/api/site'&&admin&&req.method==='PUT'){if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Origin invalid'});const b=await body(req);for(const k of ['forms','announcements','members'])if(!Array.isArray(b[k]))return json(res,400,{error:'Invalid content'});db.prepare('INSERT OR REPLACE INTO content VALUES (?,?)').run('site',JSON.stringify(b));return json(res,200,{ok:true});}
 if(p==='/api/stats'&&admin){return json(res,200,{visits:db.prepare("SELECT substr(created,1,10) day,count(*) count FROM visits WHERE created>=? GROUP BY day").all(new Date(Date.now()-7*86400000).toISOString()),responses:db.prepare('SELECT * FROM responses ORDER BY id DESC').all().map(r=>({...r,value:JSON.parse(r.value)})),formVisits:db.prepare("SELECT page,count(*) count FROM visits WHERE page LIKE '/forms/%' GROUP BY page").all()});}
 if(p==='/api/visit'&&!admin&&req.method==='POST'){const b=await body(req);db.prepare('INSERT INTO visits VALUES (?,?)').run(new Date().toISOString(),String(b.page||'/').slice(0,200));return json(res,200,{ok:true});}
 if(p==='/api/respond'&&!admin&&req.method==='POST'){const b=await body(req),f=get().forms.find(f=>f.id===b.form&&f.published);if(!f)return json(res,404,{error:'Formulaire introuvable'});if(!b.answers||typeof b.answers!=='object')return json(res,400,{error:'Réponses invalides'});for(const q of f.questions){const v=b.answers[q.id];if(q.required&&!String(v||'').trim())return json(res,400,{error:'Veuillez remplir les champs obligatoires'});if(v&&q.type==='choice'&&!q.options.includes(v))return json(res,400,{error:'Choix invalide'});}db.prepare('INSERT INTO responses(form,created,value) VALUES (?,?,?)').run(f.id,new Date().toISOString(),JSON.stringify(b.answers));return json(res,201,{ok:true});}
 if(p.startsWith('/api/'))return json(res,404,{error:'Not found'});
 const root=path.resolve(admin?'admin':'public');const requested=p==='/'||(!path.extname(p))?'/index.html':p;const file=path.resolve(root,'.'+requested);if(!file.startsWith(root+path.sep)||!existsSync(file)){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(readFileSync(file));
 }catch(e){json(res,400,{error:e.message});}});}
createServer().listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Public site listening on port '+(process.env.PORT||3000)));
createServer(true).listen(Number(process.env.ADMIN_PORT||3001),'0.0.0.0',()=>console.log('Separate admin application listening on port '+(process.env.ADMIN_PORT||3001)));
