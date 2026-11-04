import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createTeamStore} from './team-store.mjs';
import {teamPage,homeTeam} from './public/team-view.js';

test('team migration preserves portraits, names and individual biographies once; deleted members stay deleted',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'team-store-')),file=path.join(dir,'team.js');
 try{
  writeFileSync(file,'export default {legacyMigrated:false,members:[]};');
  const legacy=[{id:'a',firstName:'Amal',lastName:'El Fassi',role:'Présidente',isPresident:true,image:'/img/a.webp',bio:'Amal accompagne les projets du bureau.',bioAr:'تواكب أمل مشاريع المكتب.',mission:'Coordination du collectif.',year:'2026',instagram:'https://instagram.com/amal'},{id:'b',firstName:'Yassine',lastName:'B.',role:'Trésorier',image:'/img/b.png',bio:'Yassine prépare le budget des activités.',year:'2026'}];
  const store=createTeamStore(file,legacy),members=store.snapshot().members;
  assert.equal(members[0].image,legacy[0].image);assert.equal(members[0].lastName,'El Fassi');assert.equal(members[0].bioAr,legacy[0].bioAr);assert.equal(members[1].bio,legacy[1].bio);
  assert.equal(createTeamStore(file,legacy).snapshot().members.length,2);
  const original=readFileSync(file,'utf8'),restore=store.save([]);assert.equal(createTeamStore(file,legacy).snapshot().members.length,0);restore();assert.equal(readFileSync(file,'utf8'),original);
  const html=teamPage(members,'fr',{logo:'/assets/logo-club.png'});
  assert.match(html,/Amal accompagne/);assert.match(html,/Yassine prépare/);assert.doesNotMatch(html,/Chaque rôle contribue/);assert.doesNotMatch(html,/member-card-top|logo-tile/);assert.match(html,/team-watermark/);
  assert.match(html,/data-reverse="true"/);assert.match(html,/team-member-number[^>]*>02/);
  assert.doesNotMatch(homeTeam(members),/team-progress|team-watermark|team-member-number/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('a simple member array accepts aliases and hides missing or unsafe optional card content',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'team-alias-')),file=path.join(dir,'team.js');
 try{
  writeFileSync(file,'export default [{name:"Salma A.",role:"Secrétaire",mandate:"Mandat 2026",photo:"/img/salma.webp",bio:"Salma organise les réunions.",quote:"Une équipe, plusieurs idées.",tone:"grisBleu",links:{email:"salma@example.com",linkedin:"https://linkedin.com/in/salma"}}];');
  const store=createTeamStore(file),m=store.snapshot().members[0],html=teamPage([m]);
  assert.match(html,/mailto:salma@example.com/);assert.match(html,/Une équipe, plusieurs idées/);assert.match(html,/data-tone="grisBleu"/);assert.match(html,/Mandat 2026/);
  const empty=teamPage([{firstName:'Sans',lastName:'Texte',email:'bad?email@example.com',instagram:'javascript:alert(1)'}]);
  assert.doesNotMatch(empty,/team-member-description|team-member-quote|team-member-links|javascript:/);
  assert.match(teamPage([]),/La prochaine équipe se dessine/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
