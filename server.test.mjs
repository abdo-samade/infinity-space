import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,copyFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
test('separate admin, publishing, required answers and statistics',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'infinity-test-'));copyFileSync(new URL('./server.mjs',import.meta.url),path.join(dir,'server.mjs'));
 const child=spawn(process.execPath,['server.mjs'],{cwd:dir,env:{...process.env,PORT:'19430',ADMIN_PORT:'19431',ADMIN_PASSWORD:'test-only-password'},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);child.stdout.on('data',c=>{text+=c;if(text.includes('Separate admin')){clearTimeout(timer);resolve();}});child.on('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited: '+code));});});
 const admin='http://127.0.0.1:19431',pub='http://127.0.0.1:19430';
 assert.equal((await fetch(admin+'/api/stats')).status,401);
 assert.equal((await fetch(admin+'/api/site')).status,401);
 assert.equal((await fetch(pub+'/api/login',{method:'POST'})).status,404);
 assert.equal((await fetch(admin+'/api/login',{method:'POST',body:JSON.stringify({password:'wrong'})})).status,401);
 const login=await fetch(admin+'/api/login',{method:'POST',body:JSON.stringify({password:'test-only-password'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const content={forms:[{id:'chess',title:'Chess',published:false,questions:[{id:'name',type:'short',label:'Nom',required:true}]}],announcements:[],members:[]};
 const save=()=>fetch(admin+'/api/site',{method:'PUT',headers:{cookie},body:JSON.stringify(content)});
 assert.equal((await save()).status,200);assert.equal((await (await fetch(pub+'/api/site')).json()).forms.length,0);
 content.forms[0].published=true;await save();assert.equal((await (await fetch(pub+'/api/site')).json()).forms.length,1);
 assert.equal((await fetch(pub+'/api/respond',{method:'POST',body:JSON.stringify({form:'chess',answers:{}})})).status,400);
 assert.equal((await fetch(pub+'/api/respond',{method:'POST',body:JSON.stringify({form:'chess',answers:{name:'Student'}})})).status,201);
 await fetch(pub+'/api/visit',{method:'POST',body:JSON.stringify({page:'/forms/chess'})});
 const stats=await(await fetch(admin+'/api/stats',{headers:{cookie}})).json();assert.equal(stats.responses.length,1);assert.equal(stats.responses[0].value.name,'Student');assert.equal(stats.formVisits[0].count,1);
 }finally{if(child.exitCode===null){child.kill();await new Promise(r=>child.once('close',r));}rmSync(dir,{recursive:true,force:true});}
});
