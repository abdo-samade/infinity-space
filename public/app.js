import {escapeHTML as e,localized,safeImage,activeLogo} from './forms-core.js';
import {wordmark,logo,icon,emptyState} from './ui.js';
import {mountForm} from './form-view.js';
import {homeTeam,teamPage} from './team-view.js';
import {footerView} from './footer-view.js';
import {CELLS,activitiesPage} from './activities-view.js';
import {bindLightbox} from './lightbox.js';

let lang=localStorage.getItem('language')==='ar'?'ar':'fr',site;
const app=document.querySelector('#app');
const t=(fr,ar)=>lang==='ar'?ar:fr;
const text=(object,key)=>localized(object,key,lang);
function frame(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.querySelector('#brand').innerHTML=wordmark(site,lang);
 document.querySelector('#brand').ariaLabel=t('Infinity Space — Accueil','إنفينيتي سبيس — الرئيسية');
 document.querySelector('#language').textContent=t('العربية','Français');
 document.querySelector('#menu').innerHTML=icon('menu');
 document.querySelector('#navigation').innerHTML=[['/#about','Le club','النادي'],['/#events','Annonces','الإعلانات'],['/#forms','Participer','المشاركة'],['/team','Notre équipe','فريقنا'],['/activities','Activités passées','الأنشطة السابقة']].map(([url,fr,ar])=>`<a href="${url}">${t(fr,ar)}</a>`).join('');
 document.querySelector('#footer').innerHTML=footerView(site,lang);
 document.querySelector('#footer-language').onclick=switchLanguage;
 document.querySelector('link[rel=icon]').href=activeLogo(site)||'/brand-logo';
}
function news(){
 if(!site.announcements.length)return emptyState(t('La prochaine page reste à écrire.','صفحتنا القادمة تنتظر.'),t('Les prochaines annonces seront publiées ici.','تُنشر الإعلانات القادمة هنا.'),'calendar');
 return `<div class="editorial-feed">${[...site.announcements].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(a=>`<article class="news-item"><time datetime="${e(a.date)}">${a.date?e(new Date(a.date+'T12:00:00').toLocaleDateString(lang==='ar'?'ar-MA':'fr-FR',{day:'2-digit',month:'short',year:'numeric'})):''}</time><div><h3>${e(text(a,'title'))}</h3><p>${e(text(a,'description'))}</p></div>${safeImage(a.image)?`<button class="announcement-poster" type="button" data-lightbox="${e(a.image)}" data-caption="${e(text(a,'title'))}" aria-label="${t('Agrandir l’affiche','عرض الملصق كاملاً')}"><img src="${e(a.image)}" alt="${e(text(a,'title'))}" loading="lazy"><span>${icon('eye')}${t('Voir l’affiche','عرض الملصق')}</span></button>`:''}</article>`).join('')}</div>`;
}
function formFeed(){
 if(!site.forms.length)return emptyState(t('Un peu de patience, beaucoup d’envies.','قريباً، فرص جديدة للمشاركة.'),t('Aucune inscription ouverte pour le moment.','لا توجد تسجيلات مفتوحة حالياً.'),'form');
 return `<div class="form-invitations">${site.forms.map(f=>`<article class="form-invitation"><div class="form-invitation-copy"><div class="eyebrow">${t('UN PREMIER PAS VERS LE COLLECTIF','خطوتك الأولى للمشاركة')}</div><h3>${e(text(f,'title'))}</h3><p>${e(text(f,'description'))}</p><p class="form-invitation-note">${f.closed?t('Les inscriptions à cette activité sont closes. Retrouvez bientôt nos prochains rendez-vous.','التسجيل في هذا النشاط مغلق. ترقب مواعيدنا القادمة.'):t('Envie de participer ? Remplissez le formulaire à côté. Quelques questions suffisent pour nous rejoindre.','هل ترغب في المشاركة؟ املأ الاستمارة بجانبك. أسئلة قليلة تكفي للانضمام إلينا.')}</p></div><div class="participate-card">${safeImage(f.image)?`<img class="invitation-header" src="${e(f.image)}" alt="" loading="lazy">`:''}<div><span class="badge ${f.closed?'closed':''}">${f.closed?t('Inscriptions closes','التسجيل مغلق'):t('Inscriptions ouvertes','التسجيل مفتوح')}</span><h3>${e(text(f,'title'))}</h3><a class="button" href="/forms/${encodeURIComponent(f.id)}">${f.closed?t('Voir le formulaire','عرض الاستمارة'):t('Remplir le formulaire','املأ الاستمارة')}${icon('arrow')}</a></div></div></article>`).join('')}</div>`;
}
function render(){
 frame();
 if(/^\/team\/?$/.test(location.pathname)){document.title=t('Notre équipe · Infinity Space','فريقنا · إنفينيتي سبيس');app.innerHTML=teamPage(site.members,lang,site);bindLightbox(app,lang);return;}
 const activityRoute=location.pathname.match(/^\/activities(?:\/([^/]+))?\/?$/);
 if(activityRoute){document.title=t('Nos activités · Infinity Space','أنشطتنا · إنفينيتي سبيس');app.innerHTML=activitiesPage(site,lang,activityRoute[1]||'');bindLightbox(app,lang);return;}
 const formId=location.pathname.match(/^\/forms\/([^/]+)\/?$/)?.[1];
 if(formId){
  const form=site.forms.find(f=>f.id===formId);
  if(!form){app.innerHTML=`<section class="section">${emptyState(t('Formulaire indisponible','الاستمارة غير متاحة'),t('Retrouvez les inscriptions sur la page du club.','تجد التسجيلات في صفحة النادي.'),'form')}<a class="text-link" href="/">${t('Retour au club','العودة إلى النادي')}${icon('arrow')}</a></section>`;return;}
  document.title=text(form,'title')+' · '+t('Infinity Space','إنفينيتي سبيس');
  mountForm(app,form,{lang,onSubmit:async answers=>{const r=await fetch('/api/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({form:form.id,answers,lang})});const b=await r.json();if(!r.ok){const err=new Error(b.error);err.errors=b.errors;throw err;}}});return;
 }
 document.title=t('Infinity Space — Le collectif étudiant de la FSBM','إنفينيتي سبيس — نادي طلبة كلية العلوم بن مسيك');
 const original=activeLogo(site,Date.now(),true);
 app.innerHTML=`<section class="hero reveal" aria-labelledby="hero-title"><div class="hero-copy"><div class="eyebrow">${t('Le collectif étudiant · Ben M’Sik','نادي الطلبة · بن مسيك')}</div><h1 id="hero-title">${t('Des passions.<br>Un <em>collectif.</em>','شغف يجمعنا.<br><em>وأفق يلهمنا.</em>')}</h1><p class="club-slogan">${e(text(site,'slogan')||t('Infinity pation in one space','شغف بلا حدود في فضاء واحد'))}</p><p>${t('Sports individuels, esport, formations et solidarité : quatre cellules, un même espace pour jouer, apprendre et agir ensemble.','الرياضات الفردية والرياضة الإلكترونية والتكوينات والتضامن: أربع خلايا وفضاء واحد للعب والتعلم والمبادرة معاً.')}</p><div class="hero-bottom"><a class="button" href="#forms">${t('Participer à la prochaine activité','شارك في النشاط القادم')}${icon('arrow')}</a></div></div><div class="poster-wrap"><div class="poster"><div class="poster-top"><b>${t('INFINITY SPACE<br>FACULTÉ DES SCIENCES BEN M’SIK','إنفينيتي سبيس<br>كلية العلوم بن مسيك')}</b><span class="poster-tag">${t('LA VIE DE CAMPUS','الحياة الجامعية')}</span></div><div class="poster-center">${original?logo(site,true,true):`<div class="poster-fallback">${t('Infinity Space','إنفينيتي سبيس')}</div>`}</div><div class="poster-bottom"><span>${t('Apprendre. Jouer. Partager. Agir.','نتعلم. نلعب. نتشارك. نبادر.')}</span>${CELLS.map(c=>icon(c.icon)).join('')}</div></div></div></section><div class="activity-strip"><div class="activity-strip-inner">${CELLS.map(c=>`<a href="/activities/${c.id}">${icon(c.icon)}${e(text(c,'title'))}</a>`).join('')}</div></div>
 <section id="about" class="section about-layout"><div><div class="eyebrow">01 / ${t('Le collectif','النادي')}</div><h2>${t('Ce qui nous lie<br>va plus loin<br>que les cours.','ما يجمعنا<br>يتجاوز قاعات<br>الدراسة.')}</h2></div><div class="about-copy"><p>${t('Infinity Space réunit les étudiants qui veulent apprendre, proposer et faire ensemble. Nos cellules ouvrent la porte aux joueurs, aux curieux et à celles et ceux qui veulent être utiles.','يجمع إنفينيتي سبيس الطلبة الذين يرغبون في التعلم والمبادرة والعمل معاً. خلايانا مفتوحة لعشاق اللعب والمعرفة وكل من يرغب في إحداث أثر إيجابي.')}</p><a class="text-link" href="/activities">${t('Explorer nos activités','اكتشف أنشطتنا')}${icon('arrow')}</a><ul class="activity-list">${CELLS.map((c,i)=>`<li>${icon(c.icon)}<a href="/activities/${c.id}">${e(text(c,'title'))}</a><small>0${i+1}</small></li>`).join('')}</ul></div></section>
 <div class="ink-section"><section id="events" class="section"><div class="section-heading"><div><div class="eyebrow">02 / ${t('Les annonces','الإعلانات')}</div><h2>${t('Les prochains<br>rendez-vous.','مواعيدنا<br>القادمة.')}</h2></div><p>${t('Touchez une affiche pour l’ouvrir et lire tous les détails.','اضغط على الملصق لعرضه كاملاً وقراءة التفاصيل.')}</p></div>${news()}</section></div>
 <section id="forms" class="section"><div class="section-heading"><div><div class="eyebrow">03 / ${t('Prendre part','شارك معنا')}</div><h2>${t('Votre place<br>est ici.','مكانك<br>هنا.')}</h2></div></div>${formFeed()}</section>
 <div class="team-section"><section id="members" class="section"><div class="section-heading"><div><div class="eyebrow">04 / ${t('Le bureau','المكتب')}</div><h2>${t('Neuf visages.<br>Un même esprit.','تسعة أعضاء.<br>وروح واحدة.')}</h2></div><p>${t('Des responsabilités partagées, une équipe qui se renouvelle pour donner sa chance à chacun.','مسؤوليات نتقاسمها، وفريق يتجدد ليمنح الجميع فرصة المشاركة.')}</p></div>${homeTeam(site.members,lang,site)}</section></div>`;
 bindLightbox(app,lang);
 if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
}
function switchLanguage(){lang=lang==='fr'?'ar':'fr';localStorage.setItem('language',lang);render();}
document.querySelector('#language').onclick=switchLanguage;
document.querySelector('#menu').onclick=()=>{const nav=document.querySelector('#navigation');const open=nav.classList.toggle('open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.querySelector('#navigation').addEventListener('click',()=>{document.querySelector('#navigation').classList.remove('open');document.querySelector('#menu').setAttribute('aria-expanded','false');});
fetch('/api/site').then(async r=>{if(!r.ok)throw Error();return r.json();}).then(s=>{site=s;render();}).catch(()=>{app.innerHTML=`<section class="section">${emptyState(t('Connexion indisponible','الاتصال غير متاح'),t('Rechargez la page pour retrouver le club.','أعد تحميل الصفحة لعرض الموقع.'),'globe')}</section>`;});
fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:location.pathname})}).catch(()=>{});
