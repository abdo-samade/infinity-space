// Interface/content language never falls back to the opposite script.
export function scriptText(value,lang='fr'){
 const clean=String(value??'').replace(lang==='ar'?/\p{Script=Latin}/gu:/\p{Script=Arabic}/gu,'').replace(/[ \t]{2,}/g,' ').trim();
 return /[\p{L}\p{N}]/u.test(clean)?clean:'';
}
const roles={president:'رئيس النادي',président:'رئيس النادي',présidente:'رئيسة النادي',presidente:'رئيسة النادي','vice-president':'نائب الرئيس','vice-président':'نائب الرئيس','vice president':'نائب الرئيس',secretaire:'الكاتب العام',secrétaire:'الكاتب العام','secrétaire général':'الكاتب العام',tresorier:'أمين المال',trésorier:'أمين المال',orga:'التنظيم',organisation:'التنظيم',rh:'الموارد البشرية','ressources humaines':'الموارد البشرية',membre:'عضو المكتب','responsable de cellule':'مسؤول خلية'};
export function contentText(object,key,lang='fr'){
 let value=object?.[key+(lang==='ar'?'Ar':'')]||'';
 if(lang==='ar'&&!value&&key==='role')value=roles[String(object?.role||'').trim().toLocaleLowerCase('fr')]||'';
 return scriptText(value,lang);
}
