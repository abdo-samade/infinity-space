import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createActivityStore} from './activity-store.mjs';
import {ActivityArticle,articleDoodles} from './public/activity-article.js';
import {localized,memberName,displayAnswer} from './public/forms-core.js';
import {normalizeActivity} from './public/activity-schema.js';

test('legacy chess migration preserves all three photos, order, dates and captions exactly once',()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'club-articles-'));
 try{
  const legacy=[{id:'chess-event',cell:'sport',date:'2026-11-04',title:'Tournoi d’échecs',titleAr:'بطولة الشطرنج',description:'Une journée de partage.',descriptionAr:'يوم من المشاركة.',media:[1,2,3].map(n=>({image:`/img/photo-${n}.jpg`,caption:'Moment '+n,captionAr:'لحظة '+n}))}];
  const store=createActivityStore(directory,legacy),snapshot=store.snapshot();
  assert.equal(snapshot.activities.length,1);assert.deepEqual(snapshot.activities[0].sections.map(s=>s.image),legacy[0].media.map(m=>m.image));assert.deepEqual(snapshot.activities[0].sections.map(s=>s.title),['Les échiquiers','L’analyse','Le partage']);assert.equal(snapshot.activities[0].sections[2].text,'Moment 3');
  assert.match(readFileSync(path.join(directory,'sport.js'),'utf8'),/Les échiquiers/);
  store.save([]);const restarted=createActivityStore(directory,legacy);assert.equal(restarted.snapshot().activities.length,0,'Deleted articles must not reappear from the old SQLite copy');
 }finally{rmSync(directory,{recursive:true,force:true});}
});
test('one editable cell file supports a simple object, human-readable date and any section count',()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'club-source-'));
 try{
  const store=createActivityStore(directory,[]),before=store.snapshot().activityRevision;
  writeFileSync(path.join(directory,'sport.js'),`export default {date:'4 novembre 2026',title:'Une journée de stratégie',titleAr:'يوم من الاستراتيجية',accentWord:'stratégie',intro:'Concentration et partage.',keywords:['Concentration'],doodles:['pawn'],sections:[{title:'Les échiquiers',text:'Premier texte.',image:'/img/1.jpg'},{title:'L’analyse',text:'Deuxième texte.',image:'/img/2.jpg'},{title:'Le partage',text:'Troisième texte.',image:'/img/3.jpg'}]};`);
  const data=store.snapshot();assert.notEqual(data.activityRevision,before);assert.equal(data.activities[0].date,'2026-11-04');
  let html=ActivityArticle(data.activities[0]);assert.match(html,/<em class="article-accent">stratégie<\/em>/);assert.match(html,/<strong class="article-accent">Concentration<\/strong>/);assert.equal((html.match(/class="article-section /g)||[]).length,3);assert.ok(html.indexOf('/img/1.jpg')<html.indexOf('/img/2.jpg'));
  const a=data.activities[0];for(let n=4;n<=35;n++)a.media.push({title:'Section '+n,caption:'Texte '+n,image:'/img/'+n+'.jpg'});store.save([a]);html=ActivityArticle(store.snapshot().activities[0]);assert.equal((html.match(/class="article-section /g)||[]).length,35);assert.match(html,/>35<\/span>/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
test('all cells share ActivityArticle and preserve their own icon library and content',()=>{
 for(const cell of ['sport','esport','formations','charity']){
  const a=normalizeActivity({id:cell,cell,title:'Titre '+cell,titleAr:'عنوان النشاط',intro:'Introduction',introAr:'مقدمة',sections:[{title:'Section',titleAr:'الفقرة',text:'Texte',textAr:'النص',image:'/img/real.jpg'}]});
  const html=ActivityArticle(a,'ar');assert.match(html,/عنوان النشاط/);assert.ok(!/\p{Script=Latin}/u.test(html.replace(/<[^>]+>/g,'')));assert.ok(articleDoodles(a.doodles).length>=4);
 }
});
test('Arabic content never falls back to Latin; known roles translate and mixed names are separated',()=>{
 assert.equal(localized({description:'Texte français'},'description','ar'),'');assert.equal(localized({role:'president'},'role','ar'),'رئيس النادي');assert.equal(localized({role:'rh'},'role','ar'),'الموارد البشرية');
 assert.equal(memberName({firstName:'ABDESAMADE عبد صمد',lastName:'مختير'},'ar'),'عبد صمد مختير');assert.equal(memberName({firstName:'ABDESAMADE عبد صمد',lastName:'M K'},'fr'),'ABDESAMADE M K');
 assert.equal(memberName({firstName:'Latin',lastName:'Only'},'ar'),'عضو المكتب');
});
test('response exports keep original Arabic answer labels despite public language filtering',()=>{
 assert.equal(displayAnswer({type:'choice',options:[{id:'uuid',label:'خيار عربي'}]},'uuid'),'خيار عربي');
 assert.equal(displayAnswer({type:'short'},'Réponse مختلطة'),'Réponse مختلطة');
});
