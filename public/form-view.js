import {escapeHTML as e, localized, safeImage, migrateForm, sectionPath, validateQuestion, errorMessage} from './forms-core.js';
import {icon} from './ui.js';

export function mountForm(container, source, {lang='fr', preview=false, onSubmit}={}) {
 const form=migrateForm(source), answers={}, shuffled=new Map();let step=0, errors={}, busy=false;
 const t=(fr,ar)=>lang==='ar'?ar:fr;
 const text=(o,k)=>localized(o,k,lang);
 function question(q){
  const name=e(q.id), value=answers[q.id];let input='';
  let opts=q.options;
  if(q.shuffle){if(!shuffled.has(q.id))shuffled.set(q.id,q.options.map(o=>({o,key:Math.random()})).sort((a,b)=>a.key-b.key).map(x=>x.o));opts=shuffled.get(q.id);}
  if(['short','long'].includes(q.type)){
   const attrs=`data-answer="${name}" id="input-${name}" aria-describedby="help-${name} error-${name}" maxlength="${Number(q.validation.maxLength)||10000}"`;
   input=q.type==='long'?`<textarea ${attrs}>${e(value)}</textarea>`:`<input ${attrs} type="${q.validation.preset==='email'?'email':q.validation.preset==='phone'?'tel':'text'}" ${q.validation.preset==='number'?'inputmode="decimal"':''} value="${e(value)}" autocomplete="off">`;
  } else if(['choice','checkboxes'].includes(q.type)){
   const selected=v=>q.type==='choice'?value===v:Array.isArray(value)&&value.includes(v);
   input=opts.map(o=>`<label class="answer-option"><input data-answer="${name}" type="${q.type==='choice'?'radio':'checkbox'}" name="${name}" value="${e(o.id)}" ${selected(o.id)?'checked':''}><span>${e(text(o,'label')||t('Option ','الخيار ')+(q.options.indexOf(o)+1))}</span></label>`).join('');
   if(q.other){const other=q.type==='choice'?(String(value||'').startsWith('__other__:')?String(value).slice(10):''):(value||[]).find(v=>v.startsWith('__other__:'))?.slice(10)||'';input+=`<label class="answer-option"><input data-answer="${name}" type="${q.type==='choice'?'radio':'checkbox'}" name="${name}" value="__other__" ${other?'checked':''}><span>${t('Autre','أخرى')}</span></label><input class="answer-other" data-other="${name}" aria-label="${t('Précisez votre réponse','حدد إجابتك')}" placeholder="${t('Précisez…','حدد…')}" value="${e(other)}">`;}
  } else if(q.type==='dropdown') input=`<select id="input-${name}" data-answer="${name}"><option value="">${t('Choisir une option','اختر إجابة')}</option>${opts.map(o=>`<option value="${e(o.id)}" ${value===o.id?'selected':''}>${e(text(o,'label')||t('Option ','الخيار ')+(q.options.indexOf(o)+1))}</option>`).join('')}</select>`;
  else if(q.type==='scale') input=`<div class="scale-options">${Array.from({length:q.max-q.min+1},(_,i)=>q.min+i).map(n=>`<label class="scale-option"><input data-answer="${name}" type="radio" name="${name}" value="${n}" ${Number(value)===n?'checked':''}><span>${n}</span></label>`).join('')}</div><div class="scale-labels"><span>${e(text(q,'minLabel'))}</span><span>${e(text(q,'maxLabel'))}</span></div>`;
  else if(['grid','checkboxGrid'].includes(q.type)) input=`<div class="answer-grid" tabindex="0" aria-label="${e(text(q,'label'))}"><table><thead><tr><th scope="col">${t('Choix','الاختيارات')}</th>${q.columns.map(c=>`<th scope="col">${e(text(c,'label'))}</th>`).join('')}</tr></thead><tbody>${q.rows.map(row=>`<tr><th scope="row">${e(text(row,'label'))}</th>${q.columns.map(c=>{const v=value?.[row.id];return `<td><label><input data-answer="${name}" data-row="${e(row.id)}" type="${q.type==='grid'?'radio':'checkbox'}" name="${name}-${e(row.id)}" value="${e(c.id)}" ${(Array.isArray(v)?v.includes(c.id):v===c.id)?'checked':''} aria-label="${e(text(row,'label')+' : '+text(c,'label'))}"></label></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
  else if(['date','time'].includes(q.type)) input=`<input id="input-${name}" type="${q.type}" data-answer="${name}" value="${e(value)}">`;
  else if(q.type==='file')input=`<div class="answer-file-control"><input id="input-${name}" type="file" data-answer="${name}" accept="${e(q.allowedTypes.join(','))}"><label class="button secondary" for="input-${name}">${t('Choisir un fichier','اختر ملفاً')}</label></div><p class="file-note">${value?e(t(value.name,'ملف مختار'))+' · ':''}${Math.round(q.maxBytes/1024)} ${t('Ko maximum','كيلوبايت كحد أقصى')} · ${e(q.allowedTypes.map(type=>lang==='ar'?({'application/pdf':'ملف بي دي إف','image/png':'صورة بي إن جي','image/jpeg':'صورة جي بي إي جي','image/webp':'صورة ويب بي','text/plain':'ملف نصي'}[type]||'ملف'):type.split('/')[1]).join(lang==='ar'?'، ':', '))}</p>`;
  if(['short','long','date','time','dropdown','file'].includes(q.type))input=input.replace('data-answer=',`aria-labelledby="label-${name}" aria-required="${!!q.required}" data-answer=`);
  return `<fieldset class="answer-question ${errors[q.id]?'invalid':''}" id="q-${name}" data-question="${name}" ${errors[q.id]?'aria-invalid="true"':''}><legend id="label-${name}">${e(text(q,'label'))}${q.required?' <span class="required-star" aria-label="'+t('obligatoire','مطلوب')+'">*</span>':''}</legend><div class="question-body">${text(q,'description')?`<p class="help" id="help-${name}">${e(text(q,'description'))}</p>`:''}${input}<p class="question-error" id="error-${name}" role="alert">${e(errors[q.id]||'')}</p></div></fieldset>`;
 }
 function readQuestion(q,field){
  if(q.type==='file')return;
  if(['choice','scale'].includes(q.type)){const selected=field.querySelector('[data-answer]:checked')?.value;answers[q.id]=selected==='__other__'?'__other__:'+field.querySelector('[data-other]').value:selected??'';}
  else if(q.type==='checkboxes')answers[q.id]=[...field.querySelectorAll('[data-answer]:checked')].map(n=>n.value==='__other__'?'__other__:'+field.querySelector('[data-other]').value:n.value);
  else if(['grid','checkboxGrid'].includes(q.type)){answers[q.id]={};for(const row of q.rows){const fields=[...field.querySelectorAll('[data-row]')].filter(n=>n.dataset.row===row.id&&n.checked).map(n=>n.value);answers[q.id][row.id]=q.type==='grid'?fields[0]||'':fields;}}
  else answers[q.id]=field.querySelector('[data-answer]')?.value||'';
 }
 function draw(){
  const path=sectionPath(form,answers);step=Math.min(step,path.length-1);const section=form.sections.find(s=>s.id===path[step]);
  if(form.closed){container.innerHTML=`<div class="form-shell"><div class="form-finish">${icon('lock')}<h1>${t('Les inscriptions sont closes.','التسجيل مغلق.')}</h1><p>${e(text(form,'title'))}</p><a href="/" class="text-link">${t('Retour au club','العودة إلى النادي')}${icon('arrow')}</a></div></div>`;return;}
  container.innerHTML=`${preview?`<div class="preview-banner">${t('Aperçu — aucune réponse ne sera envoyée.','معاينة — لن يتم إرسال أي إجابة.')}</div>`:''}<div class="form-shell">${!preview?`<a class="form-back" href="/">${icon('arrow')}${t('Retour au club','العودة إلى النادي')}</a>`:''}${safeImage(form.image)?`<img class="form-cover" src="${e(form.image)}" alt="">`:''}<div class="form-intro"><div class="eyebrow">${t('INFINITY SPACE · FSBM','إنفينيتي سبيس · كلية العلوم بن مسيك')}</div><h1>${e(text(form,'title'))}</h1><p>${e(text(form,'description'))}</p><div class="form-meta">${icon('lock')} ${t('Vos réponses sont transmises au bureau du club.','يتم إرسال إجاباتك إلى مكتب النادي.')}</div></div><div class="form-progress" role="progressbar" aria-valuenow="${step+1}" aria-valuemin="0" aria-valuemax="${path.length}" aria-label="${t('Progression','التقدم')}"><span style="width:${(step+1)/path.length*100}%"></span></div><div class="step-label"><span>${t('Section','القسم')} ${step+1} / ${path.length}</span><span>${t('* Champs obligatoires','* حقول مطلوبة')}</span></div><form id="response" novalidate><div class="form-section-heading"><h2>${e(text(section,'title'))}</h2><p>${e(text(section,'description'))}</p></div>${form.questions.filter(q=>q.section===section.id).map(question).join('')}<p id="form-error" class="form-error" role="alert"></p><div class="form-controls"><button type="button" class="button secondary" id="previous" ${step===0?'hidden':''}>${t('Précédent','السابق')}</button><button class="button" id="next">${step<path.length-1?t('Suivant','التالي'):t('Envoyer ma réponse','إرسال الإجابة')}${icon('arrow')}</button></div><p class="form-privacy">${t('Ne partagez aucun mot de passe ni information sensible. Contactez Infinity Space pour toute demande relative à vos réponses.','لا تشارك كلمات المرور أو المعلومات الحساسة. تواصل مع إنفينيتي سبيس بشأن إجاباتك.')}</p></form></div>`;
  container.querySelectorAll('[data-question]').forEach(field=>{
   const q=form.questions.find(q=>q.id===field.dataset.question);
   field.addEventListener('input',()=>{readQuestion(q,field);field.classList.remove('invalid');field.removeAttribute('aria-invalid');const path=sectionPath(form,answers);container.querySelector('#next').innerHTML=(step<path.length-1?t('Suivant','التالي'):t('Envoyer ma réponse','إرسال الإجابة'))+icon('arrow');});
   if(q.type==='file')field.querySelector('input').onchange=async event=>{const file=event.target.files[0];if(!file){delete answers[q.id];return;}if(file.size>q.maxBytes||!q.allowedTypes.includes(file.type)){errors[q.id]=errorMessage('file',lang);draw();return;}busy=true;container.querySelector('#next').disabled=true;try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});answers[q.id]={name:file.name,size:file.size,type:file.type,data};field.querySelector('.file-note').textContent=t(file.name,'تم اختيار الملف');}finally{busy=false;container.querySelector('#next').disabled=false;}};
  });
  container.querySelector('#previous').onclick=()=>{if(step>0){step--;errors={};draw();container.scrollIntoView({block:'start'});}};
  container.querySelector('#response').onsubmit=async event=>{
   event.preventDefault();if(busy)return;errors={};const current=form.questions.filter(q=>q.section===section.id);
   for(const q of current){const code=validateQuestion(q,answers[q.id]);if(code)errors[q.id]=errorMessage(code,lang);}
   if(Object.keys(errors).length){draw();focusError();return;}
   const newPath=sectionPath(form,answers);
   if(step<newPath.length-1){step++;draw();container.scrollIntoView({block:'start'});return;}
   if(preview){finish();return;}
   const button=container.querySelector('#next');button.disabled=true;
   try{await onSubmit(answers);finish();}catch(err){errors=err.errors||{};if(Object.keys(errors).length){const first=form.questions.find(q=>errors[q.id]);const index=sectionPath(form,answers).indexOf(first?.section);if(index>=0)step=index;draw();focusError();}container.querySelector('#form-error').textContent=err.message;const next=container.querySelector('#next');if(next)next.disabled=false;}
  };
 }
 function focusError(){const field=container.querySelector('.invalid');field?.scrollIntoView({block:'center'});field?.querySelector('input,textarea,select')?.focus({preventScroll:true});}
 function finish(){container.innerHTML=`<div class="form-shell"><div class="form-finish">${icon('check')}<h1>${t('C’est noté. Merci !','تم التسجيل. شكراً!')}</h1><p>${e(text(form,'confirmation')||t('Votre réponse a bien été enregistrée. À très bientôt chez Infinity Space.','تم تسجيل إجابتك. نراك قريباً في إنفينيتي سبيس.'))}</p><div class="form-result-links">${!preview?`<a class="button secondary" href="/">${t('Retour au club','العودة إلى النادي')}</a>`:''}${form.submitAnother||preview?`<button class="button" id="another">${t('Envoyer une autre réponse','إرسال إجابة أخرى')}</button>`:''}</div></div></div>`;const another=container.querySelector('#another');if(another)another.onclick=()=>mountForm(container,source,{lang,preview,onSubmit});}
 draw();
 return {answers};
}
