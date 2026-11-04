import {mountForm} from '/shared/form-view.js';
const query=new URLSearchParams(location.search),lang=query.get('lang')==='ar'?'ar':'fr';
document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
const root=document.querySelector('#preview');
try{const r=await fetch('/api/drafts');if(!r.ok)throw Error('Connectez-vous à l’administration pour ouvrir cet aperçu.');const drafts=await r.json();const f=drafts.find(d=>d.id===query.get('id'))?.value;if(!f)throw Error('Brouillon introuvable.');mountForm(root,{...f,closed:false},{lang,preview:true});}catch(err){root.textContent=err.message;}
