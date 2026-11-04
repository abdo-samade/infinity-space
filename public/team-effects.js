import {articleDoodles} from './activity-article.js';

// A single lifecycle per rendered page: language changes dispose every listener.
export function mountTeamEffects(root){
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),controller=new AbortController();
 const layer=root.querySelector('.team-doodles'),progress=root.querySelector('.team-progress>span');
 const cards=[...root.querySelectorAll('.team-profile')],photos=[...root.querySelectorAll('.team-portrait')];
 const doodles=articleDoodles(['infinity','pawn','card','game','bulb','book','heart']),columns=innerWidth<=760?3:6,rows=6;
 if(layer)layer.innerHTML=Array.from({length:columns*rows},(_,i)=>{const d=doodles[i%doodles.length],size=35+Math.random()*20,x=(i%columns+.15+Math.random()*.6)/columns*100,y=(Math.floor(i/columns)+.1+Math.random()*.7)/rows*100;return `<svg data-team-doodle="${d.name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${size}px;height:${size}px;inset-inline-start:${x}%;inset-block-start:${y}%;transform:rotate(${Math.random()*80-40}deg)"><path d="${d.path}"/></svg>`;}).join('');
 let observer,frame=0;
 if(!motion.matches&&'IntersectionObserver'in window){
  observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.08});
  for(const card of cards){card.classList.add('will-reveal');observer.observe(card);}
 }
 function update(){
  frame=0;
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress)progress.style.width=(max>0?Math.max(0,Math.min(1,scrollY/max))*100:100)+'%';
  const bounds=root.getBoundingClientRect();
  // Decorate the main content only; leave header, footer and CTA untouched.
  if(layer)layer.style.clipPath=`inset(${Math.max(0,bounds.top)}px 0 ${Math.max(0,innerHeight-bounds.bottom)}px 0)`;
  for(const photo of photos){
   if(motion.matches){photo.style.removeProperty('--parallax');continue;}
   const box=photo.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)continue;
   const fraction=Math.max(-1,Math.min(1,(innerHeight/2-box.top-box.height/2)/(innerHeight/2+box.height/2)));
   photo.style.setProperty('--parallax',fraction*box.height*.08+'px');
  }
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 addEventListener('scroll',schedule,{passive:true,signal:controller.signal});
 addEventListener('resize',schedule,{passive:true,signal:controller.signal});
 motion.addEventListener('change',()=>{if(motion.matches){observer?.disconnect();cards.forEach(card=>card.classList.add('is-visible'));}schedule();},{signal:controller.signal});
 // Font and image loads may alter the document height after the first paint.
 root.addEventListener('load',schedule,{capture:true,signal:controller.signal});
 update();
 return ()=>{controller.abort();observer?.disconnect();if(frame)cancelAnimationFrame(frame);};
}
