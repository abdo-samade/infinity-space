import {icon} from '/shared/ui.js';
// Local-only canvas processing: no image leaves the browser before explicit save.
export async function cropPortrait(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('Photo : PNG, JPEG ou WebP, 12 Mo maximum avant compression.');
 const url=URL.createObjectURL(file),image=new Image();
 try{image.src=url;await image.decode();if(image.naturalWidth>16000||image.naturalHeight>16000)throw Error('Image trop grande. Maximum 16 000 pixels par côté.');
  return await new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='crop-dialog';dialog.innerHTML=`<div class="crop-heading"><div><h2>Le bon cadrage.</h2><p>Faites glisser la photo pour la positionner. La transparence est conservée.</p></div><button type="button" class="icon-button" id="crop-cancel" aria-label="Annuler">${icon('close')}</button></div><div class="crop-workspace"><canvas id="crop-canvas" width="400" height="500" tabindex="0" aria-label="Zone de recadrage. Utilisez les flèches pour déplacer la photo."></canvas></div><div class="crop-controls"><label class="field"><span>Format</span><select id="crop-ratio"><option value="portrait">Portrait 4:5</option><option value="square">Carré 1:1</option></select></label><label class="field"><span>Zoom</span><input type="range" id="crop-zoom" min="1" max="3" step="0.01" value="1"></label></div><p class="hint">Sortie WebP · côté maximum 1 000 px · qualité 85 %.</p><div class="actions footer-actions"><button class="button accent" id="crop-apply">${icon('check')}Utiliser ce cadrage</button><button class="button secondary" id="crop-reset">Recentrer</button></div>`;
   document.body.append(dialog);const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');let zoom=1,x=0,y=0,drag;
   const scale=()=>Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight)*zoom;
   function draw(){const s=scale(),w=image.naturalWidth*s,h=image.naturalHeight*s;x=Math.max(-(w-canvas.width)/2,Math.min((w-canvas.width)/2,x));y=Math.max(-(h-canvas.height)/2,Math.min((h-canvas.height)/2,y));ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,(canvas.width-w)/2+x,(canvas.height-h)/2+y,w,h);}
   function finish(value){dialog.close();dialog.remove();resolve(value);}
   canvas.onpointerdown=ev=>{drag={x:ev.clientX,y:ev.clientY,offsetX:x,offsetY:y};canvas.setPointerCapture(ev.pointerId);};
   canvas.onpointermove=ev=>{if(!drag)return;const r=canvas.getBoundingClientRect();x=drag.offsetX+(ev.clientX-drag.x)*canvas.width/r.width;y=drag.offsetY+(ev.clientY-drag.y)*canvas.height/r.height;draw();};
   canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
   canvas.onkeydown=ev=>{const step=ev.shiftKey?20:5;if(ev.key==='ArrowLeft')x-=step;else if(ev.key==='ArrowRight')x+=step;else if(ev.key==='ArrowUp')y-=step;else if(ev.key==='ArrowDown')y+=step;else return;ev.preventDefault();draw();};
   dialog.querySelector('#crop-zoom').oninput=ev=>{zoom=Number(ev.target.value);draw();};
   dialog.querySelector('#crop-ratio').onchange=ev=>{canvas.height=ev.target.value==='square'?400:500;x=y=0;draw();};
   dialog.querySelector('#crop-reset').onclick=()=>{x=y=0;zoom=1;dialog.querySelector('#crop-zoom').value=1;draw();};
   dialog.querySelector('#crop-cancel').onclick=()=>finish(null);dialog.oncancel=ev=>{ev.preventDefault();finish(null);};
   dialog.querySelector('#crop-apply').onclick=()=>{const out=document.createElement('canvas'),factor=1000/Math.max(canvas.width,canvas.height);out.width=Math.round(canvas.width*factor);out.height=Math.round(canvas.height*factor);const c=out.getContext('2d'),s=scale(),w=image.naturalWidth*s,h=image.naturalHeight*s;c.drawImage(image,((canvas.width-w)/2+x)*factor,((canvas.height-h)/2+y)*factor,w*factor,h*factor);let result=out.toDataURL('image/webp',.85);if(result.length>1_400_000){out.width=Math.round(out.width*.8);out.height=Math.round(out.height*.8);out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);result=out.toDataURL('image/webp',.85);}finish(result);};
   dialog.showModal();draw();
  });
 }finally{URL.revokeObjectURL(url);}
}
