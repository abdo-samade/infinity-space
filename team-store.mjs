import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {validateTeamMembers} from './public/team-schema.js';

export function createTeamStore(file,legacy=[]){
 mkdirSync(path.dirname(file),{recursive:true});
 function read(){
  try{
   const expression=readFileSync(file,'utf8').replace(/^\s*(?:\/\/[^\n]*\n\s*)*export\s+default\s+/,'').trim().replace(/;\s*$/,'');
   let data=JSON.parse(JSON.stringify(vm.runInNewContext('('+expression+'\n)',Object.create(null),{timeout:150})));
   if(Array.isArray(data))data={legacyMigrated:true,members:data};
   return {...data,members:validateTeamMembers(data.members)};
  }catch(error){throw Error('Fichier team.js : '+error.message);}
 }
 function write(data){
  const members=data.members.map(({image,instagram,linkedin,email,photo,links,...m})=>({...m,photo:image||'',links:{instagram:instagram||'',linkedin:linkedin||'',email:email||''}}));
  writeFileSync(file+'.tmp','// Bureau du club : textes, portraits, teintes et liens. Modifiable aussi depuis le manager.\nexport default '+JSON.stringify({...data,members},null,2)+';\n');renameSync(file+'.tmp',file);
 }
 if(!existsSync(file))write({legacyMigrated:false,members:[]});
 const data=read();
 if(!data.legacyMigrated){const ids=new Set(data.members.map(m=>m.id));data.members.push(...validateTeamMembers(legacy).filter(m=>!ids.has(m.id)));validateTeamMembers(data.members);write({...data,legacyMigrated:true});}
 function snapshot(){return {members:read().members,teamRevision:createHash('sha256').update(readFileSync(file)).digest('hex')};}
 function save(members){
  const previous=readFileSync(file,'utf8'),restore=()=>writeFileSync(file,previous),old=read();
  try{const next=validateTeamMembers(members);if(JSON.stringify(next)!==JSON.stringify(old.members))write({...old,legacyMigrated:true,members:next});}catch(error){restore();throw error;}
  return restore;
 }
 return {snapshot,save};
}
