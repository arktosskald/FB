/* F&B 0.47 local worksheets; no HTTP, no game IPC, no arbitrary HTML from users. */
(()=>{'use strict';
const root=document.querySelector('[data-fb47-tool]');if(!root)return;
const mode=root.dataset.fb47Tool,en=document.documentElement.lang==='en',t=(ru,eng)=>en?eng:ru;
const target=document.getElementById('fb47-controls'),status=document.getElementById('fb47-status'),exporter=document.getElementById('fb47-export');
const nojs=document.getElementById('fb47-nojs');if(nojs)nojs.hidden=true;
const key='zonebook.fb47.v1.'+mode;
const clamp=(n,max=9999)=>Math.max(0,Math.min(max,Number.isFinite(Number(n))?Math.round(Number(n)):0));
const short=(s,n=300)=>String(s||'').trim().slice(0,n);
let storage=true;
function load(){try{const raw=localStorage.getItem(key);if(!raw)return {};if(raw.length>24000)throw Error('size');const parsed=JSON.parse(raw);if(!parsed||parsed.schema!==1||typeof parsed.data!=='object'||Array.isArray(parsed.data))return {};return parsed.data;}catch{storage=false;return {};}}
function save(value){try{const raw=JSON.stringify({schema:1,data:value});if(raw.length>18000)throw Error('size');localStorage.setItem(key,raw);storage=true;return true;}catch{storage=false;return false;}}
function report(message){status.textContent=message;}
function storedMessage(){return storage?t('Сохранено локально в браузере. Ничего не опубликовано.','Saved in this browser. Nothing was published.'):t('Хранилище недоступно. Запись действует до перезагрузки страницы; используйте текстовую выгрузку.','Storage unavailable. This entry lasts until reload; use text export.');}
function showExport(text){exporter.hidden=false;exporter.value=String(text).slice(0,14000);exporter.focus();exporter.select();}
function saveButton(label='Сохранить',enLabel='Save'){return `<button type="submit">${t(label,enLabel)}</button>`;}
function localButtons(){return `<button type="button" class="secondary" data-act="export">${t('Выгрузить текст','Export text')}</button><button type="button" class="danger" data-act="clear">${t('Очистить','Clear')}</button>`;}
function field(name,ru,eng,limit=160,tag='input'){const label=t(ru,eng);return `<label for="fb47-${name}">${label}${tag==='textarea'?`<textarea id="fb47-${name}" name="${name}" maxlength="${limit}" rows="3"></textarea>`:`<input id="fb47-${name}" name="${name}" type="text" maxlength="${limit}" autocomplete="off">`}</label>`;}
function formValues(form,names){const out={};for(const name of names)out[name]=short(form.elements[name].value,form.elements[name].maxLength>0?form.elements[name].maxLength:300);return out;}
function exportLines(rows){showExport(rows.map(([name,value])=>name+': '+value).join('\n'));}
const stored=load();
if(mode==='departure'){
 const names=['objective','fallback','retreat'];const checks=['route','healing','ammo','shelter'];
 target.innerHTML=`<form id="fb47-form">${field('objective','Цель выхода','Objective',220)}${field('fallback','Запасной маршрут','Fallback route',220)}${field('retreat','Когда возвращаться','Retreat condition',220)}
 <fieldset><legend>${t('Перед выходом','Before departure')}</legend>${[[ 'route','Путь известен','Route reviewed'],['healing','Лечение проверено','Medical supplies checked'],['ammo','Совместимость патронов проверена','Ammunition compatibility checked'],['shelter','Укрытие и запасной выход отмечены','Shelter and fallback recorded']].map(([name,ru,eng])=>`<label class="fb47-check"><input type="checkbox" name="${name}">${t(ru,eng)}</label>`).join('')}</fieldset><div class="fb47-actions">${saveButton()}${localButtons()}</div></form>`;
 const form=target.querySelector('form');names.forEach(name=>{form.elements[name].value=short(stored[name],220)});checks.forEach(name=>{form.elements[name].checked=stored[name]===true});
 const take=()=>({...formValues(form,names),...Object.fromEntries(checks.map(name=>[name,form.elements[name].checked]))});
 const print=()=>{const value=take();exportLines([[t('Цель','Objective'),value.objective],[t('Запасной маршрут','Fallback'),value.fallback],[t('Условие возвращения','Retreat trigger'),value.retreat],...checks.map(name=>[name,value[name]?t('да','yes'):t('нет','no')])]);};
 form.addEventListener('submit',ev=>{ev.preventDefault();save(take());report(storedMessage())});
 form.querySelector('[data-act=export]').addEventListener('click',print);
 form.querySelector('[data-act=clear]').addEventListener('click',()=>{names.forEach(name=>form.elements[name].value='');checks.forEach(name=>form.elements[name].checked=false);save({});report(storedMessage());exporter.hidden=true});
}
else if(mode==='observations'){
 let entries=Array.isArray(stored.entries)?stored.entries.filter(x=>x&&typeof x==='object').slice(-40).map(x=>({id:clamp(x.id,10000000),title:short(x.title,100),location:short(x.location,100),time:short(x.time,80),source:['seen','heard','reported','inference'].includes(x.source)?x.source:'reported',note:short(x.note,500)})):[];
 let next=clamp(stored.next,10000000);
 const sourceLabels={seen:t('Видел лично','Witnessed'),heard:t('Слышал','Heard'),reported:t('Чужое сообщение','Reported'),inference:t('Предположение','Inference')};
 target.innerHTML=`<form id="fb47-form"><div class="fb47-fields">${field('title','Краткая тема','Subject',100)}${field('location','Локация и ориентир','Level and landmark',100)}${field('time','Время игры / давность','Game time / age',80)}<label>${t('Источник','Source')}<select name="source">${Object.entries(sourceLabels).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label></div>${field('note','Свидетельство / замечания','Observation / notes',500,'textarea')}<div class="fb47-actions">${saveButton('Добавить запись','Add entry')}<button class="secondary" type="button" data-act="export">${t('Выгрузить журнал','Export log')}</button><button class="danger" type="button" data-act="clear">${t('Очистить журнал','Clear log')}</button></div></form>
 <label>${t('Фильтр записей','Filter entries')}<input type="search" id="fb47-filter" maxlength="100" autocomplete="off"></label><p class="fb47-count" id="fb47-count"></p><div id="fb47-list"></div>`;
 const form=target.querySelector('form'),filter=target.querySelector('#fb47-filter'),list=target.querySelector('#fb47-list'),count=target.querySelector('#fb47-count');
 function persist(){save({schema:1,next,entries});report(storedMessage())}
 function draw(){list.replaceChildren();const query=short(filter.value,100).toLocaleLowerCase();const shown=entries.filter(e=>(e.title+' '+e.location+' '+e.time+' '+e.note).toLocaleLowerCase().includes(query)).slice().reverse();count.textContent=t('Показано: ','Shown: ')+shown.length+' / '+entries.length+' · '+t('не более 40 записей','max 40 entries');
  if(!shown.length){const p=document.createElement('p');p.textContent=t('Нет подходящих записей.','No matching entries.');list.append(p)}
  for(const e of shown){const article=document.createElement('article');article.className='fb47-row';const h=document.createElement('strong');h.textContent=e.title||t('Без названия','Untitled');const meta=document.createElement('small');meta.textContent=[e.location,e.time,sourceLabels[e.source]].filter(Boolean).join(' · ');const p=document.createElement('p');p.textContent=e.note;const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=t('Удалить','Delete');b.addEventListener('click',()=>{entries=entries.filter(row=>row.id!==e.id);persist();draw()});article.append(h,meta,p,b);list.append(article)}
 }
 form.addEventListener('submit',ev=>{ev.preventDefault();const fields=formValues(form,['title','location','time','note']);if(!fields.title||!fields.note){report(t('Введите тему и описание.','Enter a subject and observation.'));return;}next=next>=9999999?1:next+1;entries.push({id:next,...fields,source:form.elements.source.value});entries=entries.slice(-40);persist();form.reset();draw()});
 filter.addEventListener('input',draw);form.querySelector('[data-act=export]').addEventListener('click',()=>showExport(entries.map(e=>'['+e.id+'] '+e.title+' | '+e.location+' | '+e.time+' | '+sourceLabels[e.source]+'\n'+e.note).join('\n\n')));
 form.querySelector('[data-act=clear]').addEventListener('click',()=>{entries=[];next=0;persist();draw();exporter.hidden=true});draw();
}
else if(mode==='rumor'){
 const source=[['saw',t('Личное наблюдение','Firsthand observation')],['reported',t('Слова знакомого','Known witness')],['unknown',t('Безымянный пересказ','Anonymous retelling')]];
 const age=[['fresh',t('Недавняя запись с временем','Recent and dated')],['old',t('Устаревшее свидетельство','Old report')],['unknown',t('Время неизвестно','Unknown time')]];
 const proof=[['independent',t('Независимая проверка','Independent verification')],['single',t('Один исходный источник','One original source')],['none',t('Не подтверждено','Unverified')]];
 const select=(name,ru,eng,options)=>`<label>${t(ru,eng)}<select name="${name}">${options.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>`;
 target.innerHTML=`<form id="fb47-form">${field('claim','Утверждение','Claim',260,'textarea')}<div class="fb47-fields">${select('source','Кто сообщил','Who reported',source)}${select('age','Давность','Age',age)}${select('proof','Проверка','Verification',proof)}</div>${field('context','Что ещё требуется проверить','What still needs checking',350,'textarea')}<div class="fb47-actions">${saveButton('Сохранить разбор','Save review')}${localButtons()}</div></form><p id="fb47-verdict" role="status"></p>`;
 const f=target.querySelector('form');for(const name of ['claim','source','age','proof','context'])if(stored[name]&&f.elements[name])f.elements[name].value=stored[name];
 const take=()=>formValues(f,['claim','source','age','proof','context']);
 const verdict=target.querySelector('#fb47-verdict');
 const assess=v=>v.proof==='independent'&&v.source==='saw'&&v.age==='fresh'?t('Хорошо задокументировано — всё равно проверяйте обстоятельства.','Well documented — still verify circumstances.'):v.proof==='none'||v.source==='unknown'?t('Неподтверждённый слух; не выдавайте за факт.','Unverified report; do not present it as fact.'):t('Частичные сведения: нужна дополнительная независимая проверка.','Partial evidence: seek independent verification.');
 const refresh=()=>{const v=take();verdict.textContent=assess(v)+' '+t('Не игровая вероятность.','Not a gameplay probability.');};
 f.addEventListener('change',refresh);f.addEventListener('input',refresh);
 f.addEventListener('submit',ev=>{ev.preventDefault();save(take());refresh();report(storedMessage())});
 f.querySelector('[data-act=export]').addEventListener('click',()=>{const v=take();exportLines([[t('Утверждение','Claim'),v.claim],[t('Источник','Source'),source.find(x=>x[0]===v.source)?.[1]||''],[t('Давность','Age'),age.find(x=>x[0]===v.age)?.[1]||''],[t('Проверка','Verification'),proof.find(x=>x[0]===v.proof)?.[1]||''],[t('Что проверить','To verify'),v.context],[t('Вывод','Assessment'),assess(v)]])});
 f.querySelector('[data-act=clear]').addEventListener('click',()=>{f.reset();save({});refresh();exporter.hidden=true;report(storedMessage())});refresh();
}
else if(mode==='supplies'){
 const rows=[[t('Перевязка','Bandages'),'bandage'],[t('Лечение','Medical'),'medical'],[t('Вода / пища','Water / food'),'food'],[t('Боеприпасы','Ammunition'),'ammo'],[t('Ремонт','Repair supplies'),'repair'],[t('Прочее','Other'),'other']];
 target.innerHTML=`<form id="fb47-form"><div style="overflow-x:auto"><table class="fb47-table"><thead><tr><th>${t('Категория','Category')}</th><th>${t('Нужно','Planned')}</th><th>${t('Есть','Carried')}</th><th>${t('Нехватка','Shortage')}</th></tr></thead><tbody>${rows.map(([label,id])=>`<tr><th scope="row">${label}</th><td><input type="number" min="0" max="9999" step="1" inputmode="numeric" name="${id}_need" aria-label="${label} ${t('нужно','planned')}"></td><td><input type="number" min="0" max="9999" step="1" inputmode="numeric" name="${id}_have" aria-label="${label} ${t('есть','carried')}"></td><td data-diff="${id}">—</td></tr>`).join('')}</tbody></table></div><div class="fb47-actions">${saveButton('Сохранить ведомость','Save ledger')}${localButtons()}</div></form><p class="fb47-count">${t('Числа вводятся вручную, инвентарь не читается.','All numbers are entered manually; inventory is not read.')}</p>`;
 const f=target.querySelector('form');for(const [,id] of rows)for(const col of ['need','have']){const key=id+'_'+col;f.elements[key].value=clamp(stored[key])}
 function take(){const v={};for(const [,id] of rows)for(const col of ['need','have'])v[id+'_'+col]=clamp(f.elements[id+'_'+col].value);return v;}
 function refresh(){const v=take();let total=0;for(const [,id] of rows){const diff=Math.max(0,v[id+'_need']-v[id+'_have']);f.querySelector('[data-diff="'+id+'"]').textContent=String(diff);total+=diff}report(t('Общая нехватка по вашим единицам: ','Total shortage in your own units: ')+total+'. '+t('Это не вес и не игровая статистика.','This is not item weight or game statistics.'))}
 f.addEventListener('input',refresh);f.addEventListener('submit',ev=>{ev.preventDefault();save(take());report(storedMessage())});
 f.querySelector('[data-act=export]').addEventListener('click',()=>{const v=take();showExport(rows.map(([label,id])=>label+': '+v[id+'_have']+' / '+v[id+'_need']+'; '+t('дефицит','shortage')+' '+Math.max(0,v[id+'_need']-v[id+'_have'])).join('\n'))});
 f.querySelector('[data-act=clear]').addEventListener('click',()=>{f.reset();save({});refresh();exporter.hidden=true;report(storedMessage())});refresh();
}
else{report(t('Неподдерживаемый локальный сервис.','Unsupported local tool.'))}
})();
