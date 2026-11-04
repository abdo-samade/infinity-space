import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {CELL_DOODLES,normalizeActivity,legacyActivity} from './public/activity-schema.js';

const cells=Object.keys(CELL_DOODLES);
export function createActivityStore(directory,legacy=[]){
 mkdirSync(directory,{recursive:true});
 const filename=cell=>path.join(directory,cell+'.js');
 function read(cell){
  const source=readFileSync(filename(cell),'utf8');
  try{
   const expression=source.replace(/^\s*(?:\/\/[^\n]*\n\s*)*export\s+default\s+/,'').trim().replace(/;\s*$/,'');
   let data=JSON.parse(JSON.stringify(vm.runInNewContext('('+expression+'\n)',Object.create(null),{timeout:150})));
   if(data?.title&&Array.isArray(data.sections)&&!Array.isArray(data.articles))data={cell,doodles:data.doodles||CELL_DOODLES[cell],legacyMigrated:true,articles:[data]};
   if(!data||!Array.isArray(data.articles)||data.articles.length>500)throw Error('articles doit être une liste.');
   for(const a of data.articles)if(!a.title||!Array.isArray(a.sections))throw Error('Chaque article doit avoir title et sections.');
   return {...data,cell,doodles:Array.isArray(data.doodles)?data.doodles:CELL_DOODLES[cell]};
  }catch(error){throw Error(`Fichier d’activités ${cell}.js : ${error.message}`);}
 }
 function write(cell,data){const file=filename(cell),temp=file+'.tmp';const source='// Contenu public de cette cellule. Modifier les objets, sans changer le template.\nexport default '+JSON.stringify(data,null,2)+';\n';writeFileSync(temp,source);renameSync(temp,file);}
 for(const cell of cells){
  if(!existsSync(filename(cell)))write(cell,{cell,doodles:CELL_DOODLES[cell],legacyMigrated:false,articles:[]});
  const data=read(cell);
  if(!data.legacyMigrated){const ids=new Set(data.articles.map(a=>a.id));for(const old of legacy.filter(a=>a.cell===cell))if(!ids.has(old.id))data.articles.push(normalizeActivity(old,cell));data.legacyMigrated=true;write(cell,data);}
 }
 function snapshot(){
  const data=cells.map(read),hash=createHash('sha256').update(cells.map(cell=>readFileSync(filename(cell))).join('\n')).digest('hex');
  return {activities:data.flatMap(d=>d.articles.map((a,i)=>legacyActivity(normalizeActivity(a,d.cell,i)))),activityCells:Object.fromEntries(data.map(d=>[d.cell,{doodles:d.doodles}])),activityRevision:hash};
 }
 function save(activities){
  const previous=new Map(cells.map(cell=>[cell,readFileSync(filename(cell),'utf8')]));
  const restore=()=>{for(const [cell,source] of previous)writeFileSync(filename(cell),source);};
  try{for(const cell of cells){const old=read(cell);const articles=activities.filter(a=>a.cell===cell).map(a=>normalizeActivity(a,cell));if(JSON.stringify(articles)!==JSON.stringify(old.articles))write(cell,{...old,legacyMigrated:true,articles});}}catch(error){restore();throw error;}
  return restore;
 }
 return {snapshot,save};
}
