import {migrateMembers,safeLink,safeImage} from './forms-core.js';

export const TEAM_TONES=['bleuVert','doré','grisBleu','beigeFoncé'];
export const safeMemberEmail=value=>typeof value==='string'&&/^[^\s@<>"'?#&]+@[^\s@<>"'?#&]+\.[^\s@<>"'?#&]+$/.test(value)?value:'';
export function normalizeTeamMembers(values=[]){
 return migrateMembers(values.map(m=>({...m,image:m.image??m.photo??'',instagram:m.instagram??m.links?.instagram??'',linkedin:m.linkedin??m.links?.linkedin??'',email:m.email??m.links?.email??''}))).map((m,i)=>({...m,tone:TEAM_TONES.includes(m.tone)?m.tone:TEAM_TONES[i%TEAM_TONES.length]}));
}
export function validateTeamMembers(values){
 if(!Array.isArray(values)||values.length>500||values.some(m=>!m||typeof m!=='object'||Array.isArray(m)))throw Error('Liste du bureau invalide (500 membres maximum).');
 const members=normalizeTeamMembers(values);
 if(members.filter(m=>m.isPresident).length>1)throw Error('Un seul membre peut être président du club.');
 if(new Set(members.map(m=>m.id)).size!==members.length)throw Error('Identifiants des membres dupliqués.');
 for(const m of members){
  if(!m.firstName?.trim()||!Number.isFinite(m.displayOrder)||!Number.isFinite(m.groupOrder))throw Error('Nom ou ordre du membre invalide.');
  for(const key of ['instagram','linkedin'])if(m[key]&&!safeLink(m[key]))throw Error('Les liens des membres doivent commencer par https://.');
  if(m.email&&!safeMemberEmail(m.email))throw Error('Adresse e-mail du membre invalide.');
  if(m.image&&!safeImage(m.image))throw Error('Photo du membre invalide.');
 }
 return members;
}
