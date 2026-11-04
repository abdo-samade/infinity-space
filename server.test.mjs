import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, cpSync, rmSync, mkdirSync, readdirSync, writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {migrateForm, migrateMembers, orderedMembers, memberName, validateAnswers, validateQuestion, validateDefinition, sectionPath, closedReason, activeLogo} from './public/forms-core.js';
import {homeTeam, teamPage} from './public/team-view.js';
import {footerView} from './public/footer-view.js';
import {activitiesPage,activityMedia} from './public/activities-view.js';

const q=(id,type,extra={})=>({id,label:id,type,required:true,...extra});
const options=['A','B'];
const legacy={id:'legacy',title:'Ancien tournoi',published:true,questions:[q('nom','short'),q('avis','long',{required:false}),q('jeu','choice',{options})]};
const dir=mkdtempSync(path.join(tmpdir(),'infinity-test-'));
const pub='http://127.0.0.1:19430',admin='http://127.0.0.1:19431';let child,cookie,site;
const request=async(route,method='GET',data,privateApp=false)=>{const r=await fetch((privateApp?admin:pub)+'/api/'+route,{method,headers:{'Content-Type':'application/json',...(privateApp&&cookie?{cookie}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json(),headers:r.headers};};
async function save(forms){const r=await request('site','PUT',{...site,forms},true);assert.equal(r.status,200,JSON.stringify(r.body));site=(await request('site','GET',undefined,true)).body;return site;}
before(async()=>{
 for(const name of ['server.mjs','activity-store.mjs','public','admin'])cpSync(new URL('./'+name,import.meta.url),path.join(dir,name),{recursive:true});
 for(const name of ['logo-club.png','logo-fsbm.png','logo-club-dark.png'])rmSync(path.join(dir,'public/assets',name),{force:true});
 mkdirSync(path.join(dir,'data'));const db=new DatabaseSync(path.join(dir,'data/club.sqlite'));
 db.exec('CREATE TABLE content (id TEXT PRIMARY KEY,value TEXT);CREATE TABLE responses (id INTEGER PRIMARY KEY,form TEXT,created TEXT,value TEXT);');
 db.prepare('INSERT INTO content VALUES (?,?)').run('site',JSON.stringify({forms:[legacy],announcements:[],members:[]}));
 db.prepare('INSERT INTO responses VALUES (?,?,?,?)').run(1,'legacy',new Date().toISOString(),JSON.stringify({nom:'Ancien membre',jeu:'A'}));db.close();
 child=spawn(process.execPath,['server.mjs'],{cwd:dir,env:{...process.env,DATA_DIR:path.join(dir,'data'),ACTIVITIES_DIR:path.join(dir,'data/activities'),PORT:'19430',ADMIN_PORT:'19431',ADMIN_PASSWORD:'test-only-password'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{let output='',errors='';const timer=setTimeout(()=>reject(Error('Startup timeout '+errors)),10000);child.stderr.on('data',c=>errors+=c);child.stdout.on('data',c=>{output+=c;if(output.includes('Separate admin')){clearTimeout(timer);resolve();}});child.on('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code+' '+errors));});});
 const login=await request('login','POST',{password:'test-only-password'},true);assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];site=(await request('site','GET',undefined,true)).body;
});
after(async()=>{if(child?.exitCode===null){child.kill();await new Promise(r=>child.once('close',r));}rmSync(dir,{recursive:true,force:true});});

test('migrates legacy fields and snapshots existing responses without losing labels',async()=>{
 const f=site.forms[0];assert.equal(f.questions[0].section,'main');assert.equal(f.questions[2].options[0].id,'A');assert.equal(f.accepting,true);
 const r=(await request('stats','GET',undefined,true)).body.responses[0];assert.equal(r.value.jeu,'A');assert.equal(r.snapshot.questions[0].label,'nom');
 const renamed=structuredClone(f);renamed.questions[0].label='Nouveau nom';await save([renamed]);const historical=(await request('stats','GET',undefined,true)).body.responses[0];assert.equal(historical.snapshot.questions[0].label,'nom');
});
test('admin is separate, authenticated, CSRF guarded; static assets have correct MIME',async()=>{
 const r=await fetch(admin+'/api/stats');assert.equal(r.status,401);assert.equal((await request('login','POST',{})).status,404);
 const csrf=await fetch(admin+'/api/site',{method:'PUT',headers:{cookie,Origin:'https://elsewhere.example'},body:JSON.stringify(site)});assert.equal(csrf.status,403);
 for(const [origin,file,type] of [[pub,'/','text/html'],[pub,'/forms-core.js','text/javascript'],[admin,'/shared/form-view.js','text/javascript'],[admin,'/preview.html','text/html'],[pub,'/assets/social.svg','image/svg+xml']]){const r=await fetch(origin+file);assert.equal(r.status,200,file);assert.ok(r.headers.get('content-type').startsWith(type));}
});
test('all eleven types validate on the server, files are private, snapshots persist',async()=>{
 const form={id:'all-types',title:'Tous les types',published:true,questions:[q('short','short',{validation:{preset:'email'}}),q('long','long'),q('choice','choice',{options,other:true}),q('checks','checkboxes',{options,other:true}),q('drop','dropdown',{options}),q('scale','scale',{min:1,max:10}),q('grid','grid',{rows:['R1','R2'],columns:['C1','C2']}),q('checkgrid','checkboxGrid',{rows:['R1'],columns:['C1','C2']}),q('date','date'),q('time','time'),q('file','file',{allowedTypes:['text/plain'],maxBytes:262144})]};
 await save([...site.forms,form]);const text=Buffer.from('Participation Infinity Space');
 const answers={short:'student@example.com',long:'Une réponse longue.',choice:'__other__:Autre jeu',checks:['A','__other__:Dama'],drop:'B',scale:8,grid:{R1:'C1',R2:'C2'},checkgrid:{R1:['C1','C2']},date:'2026-11-04',time:'18:30',file:{name:'note.txt',type:'text/plain',size:text.length,data:text.toString('base64')}};
 const bad={...answers,short:'no',checks:['X'],scale:11,date:'2026-02-31',time:'29:99',grid:{R1:'X'},checkgrid:{R1:['X']}};const rejected=await request('respond','POST',{form:form.id,answers:bad,lang:'ar'});assert.equal(rejected.status,422);for(const id of ['short','checks','scale','date','time','grid','checkgrid'])assert.ok(rejected.body.errors[id],id);assert.match(rejected.body.error,/[\u0600-\u06ff]/);
 assert.equal((await request('respond','POST',{form:form.id,answers})).status,201);
 const r=(await request('stats','GET',undefined,true)).body.responses.find(r=>r.form===form.id);assert.equal(r.snapshot.questions.length,11);assert.ok(r.value.file.fileId);assert.equal(r.value.file.data,undefined);
 assert.equal((await fetch(pub+'/api/files/'+r.value.file.fileId)).status,404);assert.equal((await fetch(admin+'/api/files/'+r.value.file.fileId)).status,401);assert.equal((await fetch(admin+'/api/files/'+r.value.file.fileId,{headers:{cookie}})).status,200);
 assert.equal((await request('responses/'+r.id,'DELETE',undefined,true)).status,200);assert.equal(readdirSync(path.join(dir,'data/uploads')).length,0);
});
test('required, allowed options, number, phone, lengths and regex are checked',()=>{
 const f=migrateForm({id:'validation',questions:[q('x','short')]});assert.equal(validateQuestion(f.questions[0],''),'required');
 for(const [validation,value,code] of [[{preset:'email'},'bad','email'],[{preset:'phone'},'abc','phone'],[{preset:'number',min:2,max:4},'5','number'],[{minLength:4},'abc','length'],[{maxLength:2},'abc','length'],[{regex:'^[A-Z]{2}$'},'aa','regex']])assert.equal(validateQuestion({...f.questions[0],validation},value),code);
 assert.throws(()=>validateDefinition(migrateForm({id:'bad-regex',published:true,title:'Bad',questions:[q('x','short',{validation:{regex:'(a+)+'}})]})),/complexe/);
 assert.equal(validateQuestion(migrateForm({questions:[q('x','checkboxes',{options})]}).questions[0],['A','A']),'option');
});
test('conditional routing validates only visited sections and strips skipped answers',async()=>{
 const form={id:'branches',title:'Branches',published:true,sections:[{id:'one'},{id:'two'},{id:'three'}],questions:[q('route','choice',{section:'one',options,routes:{A:'three',B:'submit'}}),q('skipped','short',{section:'two'}),q('last','short',{section:'three'})]};
 await save([...site.forms,form]);assert.deepEqual(sectionPath(migrateForm(form),{route:'A'}),['one','three']);assert.deepEqual(validateAnswers(migrateForm(form),{route:'B'}),{});
 const a=await request('respond','POST',{form:form.id,answers:{route:'A',last:'yes',skipped:'Do not store'}});assert.equal(a.status,201);const saved=(await request('stats','GET',undefined,true)).body.responses.find(r=>r.id===a.body.id);assert.equal(saved.value.skipped,undefined);
 assert.equal((await request('respond','POST',{form:form.id,answers:{route:'B'}})).status,201);
 const invalid=structuredClone(form);invalid.questions[0].routes.A='one';assert.throws(()=>validateDefinition(migrateForm(invalid)),/suivante/);
});
test('response limits are enforced for simultaneous submissions, dates and toggles close forms',async()=>{
 const f={id:'limited',title:'Une place',published:true,maxResponses:1,questions:[q('name','short')]};await save([...site.forms,f]);
 const results=await Promise.all([1,2,3].map(i=>request('respond','POST',{form:f.id,answers:{name:'Student '+i}})));assert.equal(results.filter(r=>r.status===201).length,1);assert.equal(results.filter(r=>r.status===409).length,2);
 assert.equal((await request('site')).body.forms.find(x=>x.id===f.id).closed,'limit');
 assert.equal(closedReason({...f,accepting:false}),'closed');assert.equal(closedReason({...f,closeDate:'2020-01-01'}),'date');
 const closed={...f,id:'closed',accepting:false};await save([...site.forms,closed]);assert.equal((await request('respond','POST',{form:closed.id,answers:{name:'x'}})).status,409);
});
test('draft autosave stays private and does not modify published content',async()=>{
 const f={id:'draft',title:'Private',published:true,questions:[q('x','short')]};assert.equal((await request('drafts/draft','PUT',f,true)).status,200);assert.ok((await request('drafts','GET',undefined,true)).body.some(x=>x.id==='draft'));assert.ok(!(await request('site')).body.forms.some(x=>x.id==='draft'));
 assert.equal((await request('drafts/draft','DELETE',undefined,true)).status,200);
 const stale={...site,revision:-1};assert.equal((await request('site','PUT',stale,true)).status,409);
});
test('file size, MIME spoofing and content mismatches are rejected before storage',async()=>{
 const f={id:'upload',title:'Upload',published:true,questions:[q('file','file',{allowedTypes:['application/pdf'],maxBytes:262144})]};await save([...site.forms,f]);
 for(const file of [{name:'x.pdf',type:'application/pdf',size:5,data:Buffer.from('hello').toString('base64')},{name:'x.exe',type:'application/x-msdownload',size:5,data:'aGVsbG8='},{name:'x.pdf',type:'application/pdf',size:999999,data:'aGVsbG8='}]){const r=await request('respond','POST',{form:f.id,answers:{file}});assert.equal(r.status,422);assert.ok(r.body.errors.file);}
 assert.equal(readdirSync(path.join(dir,'data/uploads')).length,0);
});
test('published and expired logo fallback and visit analytics',async()=>{
 const logo='data:image/png;base64,aGVsbG8=';assert.equal(activeLogo({logo,temporaryLogo:logo,logoUntil:'2000-01-01'}),logo);assert.equal(activeLogo({logo,temporaryLogo:'data:image/png;base64,eA==',logoUntil:'2099-01-01'}),'data:image/png;base64,eA==');
 const draft={id:'hidden',title:'Hidden',published:false,questions:[]};await save([...site.forms,draft]);assert.ok(!(await request('site')).body.forms.some(f=>f.id==='hidden'));
 await request('visit','POST',{page:'/forms/legacy'});const s=(await request('stats','GET',undefined,true)).body;assert.equal(s.formVisits.find(v=>v.page==='/forms/legacy').count,1);assert.equal(s.visits.reduce((a,b)=>a+b.count,0),1);
});
test('team migration, unique president, ordering, homepage cap and equal member rows',async()=>{
 const old=migrateMembers([{name:'Amal El Fassi',role:'Présidente'}])[0];assert.equal(old.firstName,'Amal');assert.equal(old.lastName,'El Fassi');assert.equal(memberName(old),'Amal El Fassi');
 const members=Array.from({length:11},(_,i)=>({id:'member-'+i,firstName:'Membre',lastName:String(i),displayOrder:i,isPresident:i===10,group:i<5?'Commissions':'Organisation',groupAr:i<5?'اللجان':'التنظيم',groupOrder:i<5?1:2}));
 assert.equal(orderedMembers(members)[0].id,'member-10');assert.equal((homeTeam(members).match(/class="bureau-card"/g)||[]).length,8);assert.equal((teamPage(members).match(/class="team-profile"/g)||[]).length,11);assert.match(teamPage(members,'ar'),/اللجان/);assert.ok(!teamPage(members).includes('president-feature'));
 const invalid=await request('site','PUT',{...site,members:members.map((m,i)=>({...m,isPresident:i>8}))},true);assert.equal(invalid.status,400);assert.match(invalid.body.error,/seul/);
 const valid=await request('site','PUT',{...site,members},true);assert.equal(valid.status,200);site=(await request('site','GET',undefined,true)).body;
 const direct=await fetch(pub+'/team');assert.equal(direct.status,200);assert.match(await direct.text(),/team-footer.css/);
 const seo=await(await fetch(pub+'/')).text();assert.ok(seo.includes('content="'+pub+'/assets/social.png"'));
 await request('visit','POST',{page:'/team'});const visits=(await request('stats','GET',undefined,true)).body.visits;assert.equal(visits.reduce((a,b)=>a+b.count,0),2);
});
test('editable footer is bilingual, hides missing contacts and rejects unsafe links',async()=>{
 const footer={description:'Le collectif',descriptionAr:'الفريق',email:'club@example.com',whatsapp:'+212600000000',facebook:'https://www.facebook.com/example',address:'Casablanca',addressAr:'الدار البيضاء',map:'https://maps.example.com/club',links:[{label:'Notre collectif',labelAr:'مجتمعنا',url:'/#about'},{label:'Équipe',labelAr:'الفريق',url:'/team'}]};
 const r=await request('site','PUT',{...site,footer},true);assert.equal(r.status,200);site=(await request('site','GET',undefined,true)).body;
 assert.match(footerView(site,'ar'),/الفريق/);assert.match(footerView(site),/mailto:club@example.com/);assert.match(footerView(site),/https:\/\/wa.me\/212600000000/);assert.ok(!footerView({...site,footer:{}}).includes('mailto:'));
 assert.equal((await request('site','PUT',{...site,footer:{...footer,map:'javascript:alert(1)'}},true)).status,400);
 assert.match(footerView(site),/Notre collectif/);
 assert.equal((await request('site','PUT',{...site,footer:{...footer,links:[{label:'Unsafe',url:'//external.example'}]}},true)).status,400);
});
test('official repository logos are detected without changing content or restarting',async()=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
 const before=(await request('site')).body;assert.equal(before.logo,'');assert.equal((await fetch(pub+'/brand-logo')).status,204);
 for(const name of ['logo-club.png','logo-fsbm.png'])writeFileSync(path.join(dir,'public/assets',name),bytes);
 const after=(await request('site')).body;assert.equal(after.logo,'/assets/logo-club.png');assert.equal(after.facultyLogo,'/assets/logo-fsbm.png');
 const favicon=await fetch(pub+'/brand-logo');assert.equal(favicon.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await favicon.arrayBuffer()),bytes);
 assert.equal((await fetch(admin+'/assets/logo-club.png')).status,200);
});
let publicImage;
test('admin image upload accepts images over 1 MiB, is authenticated and validates types',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
 const bytes=Buffer.concat([png,Buffer.alloc(2*1024*1024)]),file={name:'large-header.png',type:'image/png',size:bytes.length,data:bytes.toString('base64')};
 assert.equal((await fetch(admin+'/api/media',{method:'POST',body:JSON.stringify(file)})).status,401);
 assert.equal((await request('media','POST',file)).status,404);
 const result=await request('media','POST',file,true);assert.equal(result.status,201);assert.match(result.body.url,/^\/media\/[a-f0-9]{32}\.png$/);publicImage=result.body.url;
 const image=await fetch(pub+publicImage);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal((await image.arrayBuffer()).byteLength,bytes.length);
 assert.equal((await fetch(admin+publicImage)).status,200);
 assert.equal((await request('media','POST',{...file,size:10*1024*1024+1,data:'aGVsbG8='},true)).status,400);
 assert.equal((await request('media','POST',{name:'fake.png',type:'image/png',size:5,data:'aGVsbG8='},true)).status,400);
});
test('four archive cells, alternating photo captions, size controls and direct routes',async()=>{
 const activity={id:'solidarite',cell:'charity',title:'Une initiative solidaire',titleAr:'مبادرة تضامنية',date:'2026-11-04',description:'Ensemble.',descriptionAr:'معاً.',media:[{image:publicImage,caption:'Premier moment',captionAr:'اللحظة الأولى',format:'square',height:302,width:80},{image:publicImage,caption:'Deuxième moment',captionAr:'اللحظة الثانية',format:'landscape',height:250,width:100}]};
 const r=await request('site','PUT',{...site,activities:[activity]},true);assert.equal(r.status,200);site=(await request('site','GET',undefined,true)).body;
 const overview=activitiesPage(site,'fr');assert.equal((overview.match(/class="cell-card /g)||[]).length,4);
 assert.match(activitiesPage(site,'ar','charity'),/مبادرة تضامنية/);assert.ok(!activitiesPage(site,'fr','sport').includes('Une initiative solidaire'));
 const story=activityMedia(activity.media);assert.match(story,/activity-moment reverse/);assert.match(story,/--media-height:302px/);assert.match(story,/--media-width:80%/);
 for(const route of ['/activities','/activities/sport','/activities/esport','/activities/formations','/activities/charity'])assert.equal((await fetch(pub+route)).status,200);
 const invalid={...activity,cell:'unknown'};assert.equal((await request('site','PUT',{...site,activities:[invalid]},true)).status,400);
 assert.equal((await request('site','PUT',{...site,activities:[{...activity,media:[{...activity.media[0],height:900}]}]},true)).status,400);
});
test('dark logo, selected-language faculty text and team photo preserve existing data',async()=>{
 const next={...site,darkLogo:publicImage,team:{image:publicImage,year:'2026–2027',intro:'Tous égaux.',introAr:'الجميع متساوون.',rotation:'Les rôles tournent.',rotationAr:'نتداول الأدوار.'}};
 assert.equal((await request('site','PUT',next,true)).status,200);site=(await request('site','GET',undefined,true)).body;
 assert.equal(activeLogo(site,Date.now(),true),publicImage);assert.equal(activeLogo(site),'/assets/logo-club.png');
 const fr=footerView(site,'fr'),ar=footerView(site,'ar');assert.ok(!fr.includes('<span lang="ar"'));assert.ok(!ar.includes('<strong>Faculté des Sciences'));
 const team=teamPage(site.members,'ar',site);assert.match(team,/الجميع متساوون/);assert.match(team,/نتداول الأدوار/);assert.match(team,/team-group-photo/);assert.match(team,/2026–2027/);
 const oldClient={forms:site.forms,announcements:site.announcements,members:site.members,revision:site.revision};assert.equal((await request('site','PUT',oldClient,true)).status,200);
 site=(await request('site','GET',undefined,true)).body;assert.equal(site.activities.length,1);assert.equal(site.team.year,'2026–2027');
});
test('manual cell-file edits reload immediately and stale admin saves cannot overwrite them',async()=>{
 site=(await request('site','GET',undefined,true)).body;
 const filename=path.join(dir,'data/activities/charity.js'),source=readFileSync(filename,'utf8');
 const value=JSON.parse(source.slice(source.indexOf('export default ')+15).trim().replace(/;$/,''));
 value.articles[0].intro='Modification dans le fichier de la cellule.';
 writeFileSync(filename,'export default '+JSON.stringify(value)+';\n');
 const current=(await request('site')).body;assert.equal(current.activities.find(a=>a.cell==='charity').description,'Modification dans le fichier de la cellule.');
 assert.equal((await request('site','PUT',site,true)).status,409);
 site=(await request('site','GET',undefined,true)).body;site.activities[0].media[0].caption='Modification depuis le manager.';
 assert.equal((await request('site','PUT',site,true)).status,200);assert.match(readFileSync(filename,'utf8'),/Modification depuis le manager/);
});
test('a duplicate server startup exits without migrating or touching activity source files',async()=>{
 const blocked=path.join(dir,'blocked-data');
 const process2=spawn(process.execPath,['server.mjs'],{cwd:dir,env:{...process.env,DATA_DIR:blocked,ACTIVITIES_DIR:path.join(blocked,'activities'),PORT:'19430',ADMIN_PORT:'19431',ADMIN_PASSWORD:'test-only-password'},stdio:['ignore','ignore','pipe']});
 let errors='';process2.stderr.on('data',chunk=>errors+=chunk);
 const code=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{process2.kill();reject(Error('Duplicate server did not exit'));},5000);process2.once('exit',code=>{clearTimeout(timer);resolve(code);});process2.once('error',reject);});
 assert.equal(code,1);assert.match(errors,/Port déjà utilisé/);assert.equal(existsSync(path.join(blocked,'activities')),false);
 assert.equal((await request('site')).status,200);
});
