// Shared, dependency-free form contract. Imported by Node and both applications.
export const TYPES = {
  short: 'Réponse courte', long: 'Paragraphe', choice: 'Choix multiple',
  checkboxes: 'Cases à cocher', dropdown: 'Liste déroulante', scale: 'Échelle linéaire',
  grid: 'Grille à choix multiple', checkboxGrid: 'Grille de cases', date: 'Date', time: 'Heure', file: 'Fichier'
};
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const localized = (object, key, lang = 'fr') => object?.[key + (lang === 'ar' ? 'Ar' : '')] || object?.[key] || '';
export const safeImage = source => typeof source === 'string' && (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(source) || /^https:\/\//.test(source) || /^\/assets\/[a-zA-Z0-9_.-]+$/.test(source) || /^\/media\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(source)) ? source : '';
export const activeLogo = (site, now = Date.now(), dark = false) => safeImage(site.temporaryLogo) && Date.parse(site.logoUntil) > now ? site.temporaryLogo : dark && safeImage(site.darkLogo) ? site.darkLogo : safeImage(site.logo);
export const memberName = (member,lang='fr') => [lang==='ar'&&member.firstNameAr||member.firstName,lang==='ar'&&member.lastNameAr||member.lastName].filter(Boolean).join(' ') || member.name || '';
export function migrateMembers(members=[]){return members.map((m,i)=>{const parts=String(m.name||'').trim().split(/\s+/);return {...m,id:m.id||`member-${i}`,firstName:m.firstName??parts.shift()??'',lastName:m.lastName??parts.join(' '),displayOrder:Number(m.displayOrder??i),groupOrder:Number(m.groupOrder||0),isPresident:!!m.isPresident};});}
export const orderedMembers = members => migrateMembers(members).sort((a,b)=>Number(b.isPresident)-Number(a.isPresident)||a.displayOrder-b.displayOrder);
export const safeLink = value => typeof value==='string'&&/^https:\/\//i.test(value)&&!/[\s<>"']/.test(value)?value:'';
export const safeNavigation = value => safeLink(value) || (typeof value==='string'&&/^\/(?!\/)[^\s<>"'\\]*$/.test(value)?value:'');
export function options(items = []) {
  return items.map((o, i) => typeof o === 'string' ? {id:o, label:o, labelAr:''} : {id:String(o.id ?? `option-${i}`), label:String(o.label ?? ''), labelAr:String(o.labelAr ?? '')});
}
export function migrateForm(input) {
  const f = structuredClone(input);
  f.accepting = f.accepting !== false;
  f.sections = f.sections?.length ? f.sections : [{id:'main', title:'', titleAr:'', description:'', descriptionAr:''}];
  f.questions = (f.questions || []).map((q, i) => ({...q,
    id:String(q.id || `question-${i}`), type:({'short answer':'short', paragraph:'long', 'multiple choice':'choice'})[q.type] || q.type || 'short',
    section:q.section || f.sections[0].id, options:options(q.options), rows:options(q.rows), columns:options(q.columns),
    validation:q.validation || {}, min:Number(q.min ?? 1), max:Number(q.max ?? 5),
    allowedTypes:q.allowedTypes || ['application/pdf', 'image/png', 'image/jpeg'], maxBytes:Math.min(Number(q.maxBytes || MAX_FILE_BYTES), MAX_FILE_BYTES)
  }));
  return f;
}
export function closedReason(form, count = 0, now = Date.now()) {
  if (form.accepting === false) return 'closed';
  if (form.closeDate && Date.parse(form.closeDate) <= now) return 'date';
  if (Number(form.maxResponses) > 0 && count >= Number(form.maxResponses)) return 'limit';
  return '';
}
export function sectionPath(form, answers = {}) {
  const path = [], seen = new Set(); let id = form.sections[0]?.id;
  while (id && id !== 'submit' && !seen.has(id)) {
    seen.add(id); path.push(id);
    const section = form.sections.find(s => s.id === id);
    if (!section) break;
    let next = form.sections[form.sections.indexOf(section) + 1]?.id;
    for (const q of form.questions.filter(q => q.section === id && ['choice','dropdown'].includes(q.type))) {
      const target = q.routes && Object.hasOwn(q.routes,answers[q.id]) ? q.routes[answers[q.id]] : '';
      if (target) { next = target; break; }
    }
    id = next;
  }
  return path;
}
const messages = {
 required:['Ce champ est obligatoire.','هذا الحقل مطلوب.'], option:['Sélectionnez une option valide.','اختر إجابة صالحة.'],
 text:['Veuillez saisir un texte valide.','يرجى إدخال نص صالح.'], email:['Saisissez une adresse e-mail valide.','أدخل بريداً إلكترونياً صالحاً.'],
 phone:['Saisissez un numéro de téléphone valide.','أدخل رقم هاتف صالحاً.'], number:['Saisissez un nombre dans les limites indiquées.','أدخل رقماً ضمن الحدود المحددة.'],
 length:['La longueur de la réponse ne respecte pas les limites.','طول الإجابة خارج الحدود المحددة.'], regex:['La réponse ne correspond pas au format demandé.','الإجابة لا تطابق الصيغة المطلوبة.'],
 scale:['Choisissez une valeur dans cette échelle.','اختر قيمة ضمن المقياس.'], grid:['Répondez aux lignes avec les choix proposés.','أجب عن الأسطر باستعمال الخيارات المتاحة.'],
 date:['Choisissez une date valide.','اختر تاريخاً صالحاً.'], time:['Choisissez une heure valide.','اختر وقتاً صالحاً.'],
 file:['Fichier invalide : vérifiez le type et la taille autorisés.','ملف غير صالح: تحقق من النوع والحجم المسموحين.']
};
export function errorMessage(code, lang = 'fr') { return (messages[code] || messages.text)[lang === 'ar' ? 1 : 0]; }
const empty = v => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
function safeRegex(pattern){
 if(typeof pattern!=='string'||pattern.length>150)return false;
 let variable=0,inClass=false;
 for(let i=0;i<pattern.length;i++){
  const c=pattern[i];if(c==='\\'){if(/[1-9k]/.test(pattern[i+1]||''))return false;i++;continue;}
  if(c==='['&&!inClass){inClass=true;continue;}if(c===']'&&inClass){inClass=false;continue;}if(inClass)continue;
  if('()|'.includes(c))return false;
  if('*+?'.includes(c))variable++;
  if(c==='{'){const end=pattern.indexOf('}',i);if(end<0)return false;const count=pattern.slice(i+1,end);if(!/^\d+(,\d*)?$/.test(count))return false;const bounds=count.split(',');if(bounds.some(n=>Number(n)>1000))return false;if(bounds.length===2&&bounds[0]!==bounds[1])variable++;i=end;}
 }
 return variable<=1&&!inClass;
}
const validChoice = (q, value) => q.options.some(o => o.id === value) || (q.other && typeof value === 'string' && value.startsWith('__other__:') && value.slice(10).trim().length > 0 && value.length <= 2010);
export function validateQuestion(q, value) {
  if (empty(value)) return q.required ? 'required' : '';
  if (['short','long'].includes(q.type)) {
    if (typeof value !== 'string' || value.length > 10000) return 'text';
    if (q.required && !value.trim()) return 'required';
    const v = q.validation || {};
    if ((v.minLength != null && value.length < Number(v.minLength)) || (v.maxLength != null && value.length > Number(v.maxLength))) return 'length';
    if (v.preset === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    if (v.preset === 'phone' && !/^\+?[\d\s().-]{6,24}$/.test(value)) return 'phone';
    if (v.preset === 'number' && (!value.trim() || !Number.isFinite(Number(value)) || (v.min !== '' && v.min != null && Number(value) < Number(v.min)) || (v.max !== '' && v.max != null && Number(value) > Number(v.max)))) return 'number';
    if (v.regex) { try { if (!safeRegex(v.regex) || value.length > 1000 || !new RegExp(v.regex, 'u').test(value)) return 'regex'; } catch { return 'regex'; } }
  } else if (['choice','dropdown'].includes(q.type)) {
    if (!validChoice(q,value)) return 'option';
  } else if (q.type === 'checkboxes') {
    if (!Array.isArray(value) || new Set(value).size !== value.length || value.some(v => !validChoice(q,v))) return 'option';
  } else if (q.type === 'scale') {
    if (!Number.isInteger(Number(value)) || Number(value) < q.min || Number(value) > q.max) return 'scale';
  } else if (['grid','checkboxGrid'].includes(q.type)) {
    if (typeof value !== 'object' || Array.isArray(value)) return 'grid';
    const ids = q.columns.map(c => c.id);
    if (Object.keys(value).some(id => !q.rows.some(r => r.id === id))) return 'grid';
    for (const row of q.rows) {
      const v = value[row.id];
      if (empty(v)) { if(q.required) return 'required'; continue; }
      if (q.type === 'grid' ? !ids.includes(v) : !Array.isArray(v) || new Set(v).size !== v.length || v.some(c => !ids.includes(c))) return 'grid';
    }
  } else if (q.type === 'date') {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) return 'date';
  } else if (q.type === 'time') {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return 'time';
  } else if (q.type === 'file') {
    if (!value || typeof value !== 'object' || !FILE_TYPES.includes(value.type) || !q.allowedTypes.includes(value.type) || !Number.isInteger(value.size) || value.size < 1 || value.size > q.maxBytes || typeof value.name !== 'string' || value.name.length > 200) return 'file';
  } else return 'text';
  return '';
}
export function validateAnswers(form, answers = {}) {
  const visible = new Set(sectionPath(form, answers)); const errors = {};
  for (const q of form.questions.filter(q => visible.has(q.section))) {
    const code = validateQuestion(q, answers[q.id]); if(code) errors[q.id] = code;
  }
  return errors;
}
export function validateDefinition(form, strict = true) {
  if (!form.id || typeof form.id !== 'string' || !/^[\w-]{1,100}$/.test(form.id)) throw Error('Identifiant de formulaire invalide.');
  if (form.questions.length > 100 || form.sections.length > 30) throw Error('Maximum : 100 questions et 30 sections.');
  if (new Set(form.questions.map(q=>q.id)).size !== form.questions.length || new Set(form.sections.map(s=>s.id)).size !== form.sections.length) throw Error('Identifiants dupliqués.');
  if (form.sections.some(s=>typeof s.id!=='string'||!/^[\w-]{1,100}$/.test(s.id))) throw Error('Identifiant de section invalide.');
  if (strict && (!String(form.title || '').trim() || !form.questions.length)) throw Error('Ajoutez un titre et au moins une question.');
  if (form.closeDate && !Number.isFinite(Date.parse(form.closeDate))) throw Error('Date de fermeture invalide.');
  if (form.maxResponses && (!Number.isInteger(Number(form.maxResponses)) || Number(form.maxResponses) < 1)) throw Error('Nombre de places invalide.');
  for (const q of form.questions) {
    if (!/^[\w-]{1,100}$/.test(q.id) || ['__proto__','constructor','prototype'].includes(q.id) || !Object.hasOwn(TYPES,q.type) || !form.sections.some(s=>s.id === q.section)) throw Error('Question ou section invalide.');
    if (strict && !String(q.label || '').trim()) throw Error('Chaque question doit avoir un titre.');
    for (const list of [q.options,q.rows,q.columns]) {
      if (list.length > 60 || new Set(list.map(o=>o.id)).size !== list.length || list.some(o=>!o.id || o.id.startsWith('__other__:'))) throw Error('Options invalides ou dupliquées.');
    }
    if (strict && ['choice','checkboxes','dropdown'].includes(q.type) && (!q.options.length || q.options.some(o=>!o.label.trim()))) throw Error('Renseignez les options.');
    if (strict && ['grid','checkboxGrid'].includes(q.type) && (!q.rows.length || !q.columns.length)) throw Error('Renseignez les lignes et colonnes.');
    if (q.type==='scale' && (q.min !== 1 || ![5,10].includes(q.max))) throw Error('Échelles acceptées : 1–5 ou 1–10.');
    for (const target of Object.values(q.routes || {})) {
      if (target !== 'submit' && form.sections.findIndex(s=>s.id===target) <= form.sections.findIndex(s=>s.id===q.section)) throw Error('Une branche doit aller vers une section suivante ou vers l’envoi.');
    }
    const v=q.validation;
    if (v.regex) { if (!safeRegex(v.regex)) throw Error('Expression régulière trop complexe : pas de groupes ni d’alternatives, une seule répétition variable.'); try { new RegExp(v.regex,'u'); } catch { throw Error('Expression régulière invalide.'); } }
    if (v.minLength && v.maxLength && Number(v.minLength)>Number(v.maxLength)) throw Error('Longueurs incohérentes.');
    if (v.min !== '' && v.max !== '' && v.min != null && v.max != null && Number(v.min)>Number(v.max)) throw Error('Bornes numériques incohérentes.');
    if (q.type==='file' && (!q.allowedTypes.length || q.allowedTypes.some(t=>!FILE_TYPES.includes(t)) || q.maxBytes < 1)) throw Error('Formats de fichier invalides.');
  }
  return form;
}
export function displayAnswer(q, value, lang='fr') {
  if (value == null || value==='') return '—';
  const option = id => id?.startsWith?.('__other__:') ? id.slice(10) : localized((q.options || []).find(o=>o.id===id), 'label', lang) || String(id);
  if (['choice','dropdown'].includes(q.type)) return option(value);
  if (q.type==='checkboxes') return value.map(option).join(', ');
  if (['grid','checkboxGrid'].includes(q.type)) return Object.entries(value).map(([id,v])=>`${localized(q.rows.find(r=>r.id===id),'label',lang) || id}: ${(Array.isArray(v)?v:[v]).map(c=>localized(q.columns.find(col=>col.id===c),'label',lang)||c).join(', ')}`).join(' / ');
  if (q.type==='file') return value.name || 'Fichier';
  return String(value);
}
