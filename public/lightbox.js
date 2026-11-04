import {icon} from './ui.js';
export function bindLightbox(root,lang='fr'){
 root.querySelectorAll('[data-lightbox]').forEach(button=>button.onclick=()=>{
  const dialog=document.createElement('dialog');dialog.className='image-lightbox';dialog.innerHTML=`<button class="lightbox-close icon-button" aria-label="${lang==='ar'?'إغلاق':'Fermer'}">${icon('close')}</button><figure><img alt=""><figcaption></figcaption></figure>`;
  const img=dialog.querySelector('img');img.src=button.dataset.lightbox;img.alt=button.dataset.caption||'';dialog.querySelector('figcaption').textContent=button.dataset.caption||'';
  document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=event=>{if(event.target===dialog)dialog.close();};dialog.onclose=()=>{dialog.remove();button.focus();};dialog.showModal();
 });
}
