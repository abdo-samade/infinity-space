export const IMAGE_LIMIT=10*1024*1024;
const pending=new Set();
export const waitForUploads=()=>Promise.all([...pending]);
export function uploadImage(file){
 const work=(async()=>{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>IMAGE_LIMIT)throw Error('Choisissez une image PNG, JPEG ou WebP de 10 Mo maximum.');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Impossible de lire cette image.'));reader.readAsDataURL(file);});
  const response=await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,size:file.size,type:file.type,data})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Échec du transfert.');return result.url;
 })();pending.add(work);work.then(()=>pending.delete(work),()=>pending.delete(work));return work;
}
