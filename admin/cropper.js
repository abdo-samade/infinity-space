import {icon} from '/shared/ui.js';
// Local canvas editing, with explicit confirmation before uploading.
export const cropPoster=file=>cropPortrait(file,{a4:true});
export async function cropPortrait(file,{a4=false}={}){
 const limit=(a4?10:12)*1024*1024;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>limit)throw Error(`Image PNG, JPEG ou WebP, ${a4?10:12} Mo maximum.`);
 const url=URL.createObjectURL(file),image=new Image();
 try{image.src=url;await image.decode();if(image.naturalWidth>16000||image.naturalHeight>16000)throw Error('Maximum 16 000 pixels par côté.');
  return await new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='crop-dialog';
   dialog.innerHTML=`<div class="crop-heading"><div><h2>${a4?'Toutes les affiches, au format A4.':'Le bon cadrage.'}</h2><p>${a4?'Format unique 210 × 297 mm, vertical. Conservez l’affiche entière ou choisissez un recadrage.':'Faites glisser la photo pour la positionner. La transparence est conservée.'}</p></div><button type="button" class="icon-button" id="crop-cancel" aria-label="Annuler">${icon('close')}</button></div><div class="crop-workspace"><canvas id="crop-canvas" width="${a4?420:400}" height="${a4?594:500}" tabindex="0" aria-label="Zone de cadrage. Flèches du clavier pour déplacer la photo."></canvas></div><div class="crop-controls"><label class="field"><span>Format</span><select id="crop-ratio">${a4?'<option value="a4">A4 · 210 × 297 mm</option>':'<option value="portrait">Portrait 4:5</option><option value="square">Carré 1:1</option>'}</select></label><label class="field"><span>Zoom</span><input type="range" id="crop-zoom" min="1" max="3" step="0.01" value="1"></label></div>${a4?'<label class="field"><span>Cadrage de l’affiche</span><select id="crop-mode"><option value="cover">Remplir et recadrer en A4</option><option value="contain">Tout conserver dans le format A4</option></select></label>':''}<p class="hint">${a4?'Sortie uniforme 1485 × 2100 px · WebP qualité 92 % · fond transparent conservé.':'Sortie WebP · côté maximum 1 000 px · qualité 85 %.'}</p><div class="actions footer-actions"><button class="button accent" id="crop-apply">${icon('check')}${a4?'Valider l’affiche A4':'Utiliser ce cadrage'}</button><button class="button secondary" id="crop-reset">Recentrer</button></div>`;
   document.body.append(dialog);const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');let zoom=1,x=0,y=0,drag,mode='cover';
   const scale=()=>Math[mode==='contain'?'min':'max'](canvas.width/image.naturalWidth,canvas.height/image.naturalHeight)*zoom;
   function draw(){const s=scale(),w=image.naturalWidth*s,h=image.naturalHeight*s,bx=Math.abs(w-canvas.width)/2,by=Math.abs(h-canvas.height)/2;x=Math.max(-bx,Math.min(bx,x));y=Math.max(-by,Math.min(by,y));ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,(canvas.width-w)/2+x,(canvas.height-h)/2+y,w,h);}
   function finish(value){dialog.close();dialog.remove();resolve(value);}
   canvas.onpointerdown=event=>{drag={x:event.clientX,y:event.clientY,offsetX:x,offsetY:y};canvas.setPointerCapture(event.pointerId);};
   canvas.onpointermove=event=>{if(!drag)return;const rect=canvas.getBoundingClientRect();x=drag.offsetX+(event.clientX-drag.x)*canvas.width/rect.width;y=drag.offsetY+(event.clientY-drag.y)*canvas.height/rect.height;draw();};
   canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
   canvas.onkeydown=event=>{const step=event.shiftKey?20:5;if(event.key==='ArrowLeft')x-=step;else if(event.key==='ArrowRight')x+=step;else if(event.key==='ArrowUp')y-=step;else if(event.key==='ArrowDown')y+=step;else return;event.preventDefault();draw();};
   dialog.querySelector('#crop-zoom').oninput=event=>{zoom=Number(event.target.value);draw();};
   dialog.querySelector('#crop-ratio').onchange=event=>{canvas.height=event.target.value==='square'?400:a4?594:500;x=y=0;draw();};
   const modeInput=dialog.querySelector('#crop-mode');if(modeInput)modeInput.onchange=event=>{mode=event.target.value;x=y=0;draw();};
   dialog.querySelector('#crop-reset').onclick=()=>{x=y=0;zoom=1;dialog.querySelector('#crop-zoom').value=1;draw();};
   dialog.querySelector('#crop-cancel').onclick=()=>finish(null);dialog.oncancel=event=>{event.preventDefault();finish(null);};
   dialog.querySelector('#crop-apply').onclick=()=>{
    const out=document.createElement('canvas'),factor=a4?1485/420:1000/Math.max(canvas.width,canvas.height);out.width=Math.round(canvas.width*factor);out.height=Math.round(canvas.height*factor);
    const s=scale(),w=image.naturalWidth*s,h=image.naturalHeight*s;out.getContext('2d').drawImage(image,((canvas.width-w)/2+x)*factor,((canvas.height-h)/2+y)*factor,w*factor,h*factor);
    let result=out.toDataURL('image/webp',a4 ? .92 : .85);
    if(!a4&&result.length>1_400_000){out.width=Math.round(out.width*.8);out.height=Math.round(out.height*.8);out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);result=out.toDataURL('image/webp',.85);}
    finish(result);
   };
   dialog.showModal();draw();
  });
 }finally{URL.revokeObjectURL(url);}
}
