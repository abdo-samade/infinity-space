export const CELL_DOODLES={sport:['pawn','checkers','pingpong','tennis','card'],esport:['game','code','headset','trophy','bolt'],formations:['book','bulb','code','brush','camera'],charity:['heart','hands','leaf','people','sun']};
const chessTitles=['Les échiquiers','L’analyse','Le partage'];
const chessTitlesAr=['رقع الشطرنج','التحليل','المشاركة'];
export function activityDate(value){
 const text=String(value||'').trim(),parts=text.toLocaleLowerCase('fr').match(/^(\d{1,2})\s+([a-zéûôîè]+)\s+(\d{4})$/u);
 const months=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
 if(parts){const month=months.indexOf(parts[2])+1;if(month)return `${parts[3]}-${String(month).padStart(2,'0')}-${parts[1].padStart(2,'0')}`;}
 return text;
}
export function normalizeActivity(value,cell=value.cell,index=0){
 const isChess=cell==='sport'&&/[éeè]checs?|chess|شطرنج/i.test(String(value.title)+' '+String(value.titleAr));
 const fromMedia=Array.isArray(value.media),source=fromMedia?value.media:value.sections||[];
 return {
  id:value.id||`activity-${cell}-${index+1}`,cell,date:activityDate(value.date),title:value.title||'',titleAr:value.titleAr||'',
  accentWord:value.accentWord||(isChess?'stratégie':''),accentWordAr:value.accentWordAr||(isChess?'الاستراتيجية':''),
  intro:fromMedia?value.description??value.intro??'':value.intro??value.description??'',introAr:fromMedia?value.descriptionAr??value.introAr??'':value.introAr??value.descriptionAr??'',
  keywords:Array.isArray(value.keywords)?value.keywords:[],keywordsAr:Array.isArray(value.keywordsAr)?value.keywordsAr:[],
  doodles:Array.isArray(value.doodles)?value.doodles:CELL_DOODLES[cell]||[],
  sections:source.map((m,i)=>({
   title:m.title||(isChess?chessTitles[i]||'Moment '+(i+1):'Moment '+(i+1)),
   titleAr:m.titleAr||(isChess?chessTitlesAr[i]||'اللحظة '+(i+1):'اللحظة '+(i+1)),
   text:fromMedia?m.caption??m.text??'':m.text??m.caption??'',textAr:fromMedia?m.captionAr??m.textAr??'':m.textAr??m.captionAr??'',image:m.image||''
  }))
 };
}
export function legacyActivity(article){return {...article,description:article.intro,descriptionAr:article.introAr,media:article.sections.map(s=>({...s,caption:s.text,captionAr:s.textAr,format:'landscape',height:302,width:100}))};}
