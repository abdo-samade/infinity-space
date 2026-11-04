import {escapeHTML as e,localized,safeImage} from './forms-core.js';
import {normalizeActivity} from './activity-schema.js';
import {icon} from './ui.js';

function highlighted(text,words,tag){
 const tokens=[...new Set(words.filter(Boolean))].sort((a,b)=>b.length-a.length);
 if(!tokens.length)return e(text);
 const pattern=new RegExp('('+tokens.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','giu');
 return String(text).split(pattern).map((part,i)=>i%2?`<${tag} class="article-accent">${e(part)}</${tag}>`:e(part)).join('');
}
export function ActivityArticle(value,lang='fr',index=0){
 const article=normalizeActivity(value,value.cell),t=(fr,ar)=>lang==='ar'?ar:fr;
 const title=localized(article,'title',lang)||t('Un moment du collectif','لحظة من أنشطة النادي');
 const intro=localized(article,'intro',lang),accent=localized(article,'accentWord',lang),keywords=lang==='ar'?article.keywordsAr:article.keywords;
 const heading=index===0?'h1':'h2';
 const parsed=Date.parse(article.date);const date=Number.isFinite(parsed)?new Date(parsed).toLocaleDateString(lang==='ar'?'ar-MA':'fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):localized({date:article.date,dateAr:article.dateAr},'date',lang);
 return `<article class="activity-article" data-article="${e(article.id||'article-'+index)}"><header class="article-heading article-reveal"><time class="article-date" datetime="${e(Number.isFinite(parsed)?new Date(parsed).toISOString().slice(0,10):'')}">${e(date)}</time><${heading} class="article-title">${highlighted(title,[accent], 'em')}</${heading}>${intro?`<p class="article-intro">${highlighted(intro,keywords,'strong')}</p>`:''}</header><div class="article-sections">${article.sections.map((s,i)=>`<section class="article-section ${i%2?'reverse':''} article-reveal"><div class="article-section-copy"><span class="article-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3>${e(localized(s,'title',lang)||t('Moment '+(i+1),'اللحظة '+(i+1)))}</h3><p>${e(localized(s,'text',lang))}</p></div>${safeImage(s.image)?`<button class="article-photo" type="button" data-lightbox="${e(s.image)}" data-caption="${e(localized(s,'title',lang)||title)}" aria-label="${t('Agrandir la photo','عرض الصورة كاملة')}"><img src="${e(s.image)}" alt="${e(localized(s,'title',lang)||title)}" loading="lazy"><span>${icon('eye')}</span></button>`:`<div class="article-photo-placeholder">${icon('image')}<p>${t('Photo à ajouter dans le fichier de la cellule.','تُضاف الصورة في ملف بيانات الخلية.')}</p></div>`}</section>`).join('')}</div></article>`;
}

const paths={
 pawn:'M8 21h8M6 18h12l-4-7V8h-4v3ZM9 5h6M12 2v6',
 checkers:'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18M6 6h.01M12 12h.01M18 18h.01',
 pingpong:'M15 3a7 7 0 1 0 3 12c4-4 3-10-3-12ZM8 15l-5 6 2 1 5-5M8 5l10 9M20 21h.01',
 tennis:'M15 2C8 0 3 8 6 13s10 4 13-2S22 3 15 2ZM8 15l-5 7m1-2 3 2M9 4l8 9m-6-11 8 9M7 7l11-2M6 11l12-3M21 20h.01',
 card:'M5 2h14v20H5zM8 5h.01M16 19h.01m-4-4-3-4 3-4 3 4Z',
 game:'M7 7h10l4 9a3 3 0 0 1-5 3l-2-2h-4l-2 2a3 3 0 0 1-5-3ZM6 12h5m-2.5-2.5v5M16 12h.01M18 14h.01',
 code:'m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
 headset:'M4 14V9a8 8 0 0 1 16 0v5M2 11h5v8H2zm15 0h5v8h-5zM20 19c0 3-4 3-7 3',
 trophy:'M7 2h10v8a5 5 0 0 1-10 0ZM7 5H2v3a5 5 0 0 0 5 5m10-8h5v3a5 5 0 0 1-5 5M12 15v6M8 22h8',
 bolt:'m13 2-9 12h7l-1 8 10-13h-8Z',
 book:'M12 5c-3-3-7-3-10-1v15c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3',
 bulb:'M8 16c0-3-4-4-4-8a8 8 0 0 1 16 0c0 4-4 5-4 8ZM8 19h8m-7 3h6M9 7l3 3 3-3m-3 3v6',
 brush:'M14 3 21 1l-3 7-8 9-5-5ZM5 12c-6 2-4 10-4 10s8 2 10-4M11 6l6 6',
 camera:'M3 6h5l2-3h4l2 3h5v15H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 9h.01',
 heart:'M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8Z',
 hands:'M2 14l5-5 5 2 5-2 5 5-7 7H9ZM2 14v6m20-6v6M7 9l4-5 3 1 3 4M8 14l4 4 5-5',
 leaf:'M21 2C6 1 1 7 4 15s16 8 17-13ZM3 22l12-12m-7 7 1-6m3 2h6',
 people:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 22v-3a7 7 0 0 1 14 0v3m2-18a4 4 0 0 1 0 8m2 3a6 6 0 0 1 4 6',
 sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
 micro:'M8 4a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v4m-4 0h8'
};
export function articleDoodles(names){return names.filter(name=>Object.hasOwn(paths,name)).map(name=>({name,path:paths[name]}));}
export function mountArticleEffects(root,names=[]){
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),controller=new AbortController();
 const layer=root.querySelector('.article-doodles'),progress=root.querySelector('.article-progress>span');
 const doodles=articleDoodles(names),columns=innerWidth<=760?3:6,rows=6;
 if(layer&&doodles.length){layer.innerHTML=Array.from({length:columns*rows},(_,i)=>{const d=doodles[i%doodles.length],size=35+Math.random()*20,x=(i%columns+.2+Math.random()*.6)/columns*100,y=(Math.floor(i/columns)+.1+Math.random()*.8)/rows*100,rotation=Math.random()*80-40;return `<svg data-doodle="${d.name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;inset-inline-start:${x}%;inset-block-start:${y}%;transform:rotate(${rotation}deg)" aria-hidden="true"><path d="${d.path}"/></svg>`;}).join('');}
 const blocks=[...root.querySelectorAll('.article-reveal')];let observer;
 if(!motion.matches&&'IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.08});for(const block of blocks){block.classList.add('will-reveal');observer.observe(block);}}
 const photos=[...root.querySelectorAll('.article-photo')],titles=[...root.querySelectorAll('.article-title')];let frame=0;
 function update(){frame=0;const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=(max>0?Math.max(0,Math.min(1,scrollY/max))*100:100)+'%';
  if(layer)layer.style.clipPath=`inset(${Math.max(0,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0)}px 0 0)`;
  for(const photo of photos){if(motion.matches){photo.style.removeProperty('--parallax');continue;}const box=photo.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)continue;const p=Math.max(-1,Math.min(1,(innerHeight/2-(box.top+box.height/2))/(innerHeight/2+box.height/2)));photo.style.setProperty('--parallax',p*box.height*.08+'px');}
  for(const title of titles){if(motion.matches)title.style.removeProperty('transform');else{const rect=title.closest('.activity-article').getBoundingClientRect();title.style.transform=`scale(${1-.1*Math.max(0,Math.min(1,-rect.top/innerHeight))})`;}}
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 addEventListener('scroll',schedule,{passive:true,signal:controller.signal});addEventListener('resize',schedule,{passive:true,signal:controller.signal});
 motion.addEventListener('change',()=>{if(motion.matches){observer?.disconnect();blocks.forEach(b=>b.classList.add('is-visible'));}schedule();},{signal:controller.signal});update();
 return ()=>{controller.abort();observer?.disconnect();if(frame)cancelAnimationFrame(frame);};
}
