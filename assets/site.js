(()=>{'use strict';
const body=document.body,root=body.dataset.root||'./',lang=document.documentElement.lang==='en'?'en':'ru',en=lang==='en',base=root+(en?'en/':'');
const say=(ru,eng)=>en?eng:ru,status=document.getElementById('status');
const host=location.hostname,local=host==='network.zonebook.local'||location.protocol==='file:';
const trustedEmbedded=location.origin==='https://network.zonebook.local';
const badge=document.getElementById('connection');if(badge){const version=badge.dataset.version;badge.textContent=(local?say('Локальная копия','Offline copy'):say('Сеть Зоны','Zone network'))+' · '+version;}
document.querySelectorAll('[data-native-route]').forEach(button=>button.addEventListener('click',()=>{
 const route=button.dataset.nativeRoute;
 if(trustedEmbedded&&window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({action:'open-native',route});if(status)status.textContent=say('Открываем раздел ноутбука…','Opening the laptop section…');}
 else{if(status){status.textContent=say('Этот сервис доступен с ноутбука ZONEbook внутри игры. Справочники и статьи можно читать здесь.','This service is available from the in-game ZONEbook laptop. Guides and articles can be read here.');status.scrollIntoView({block:'nearest',behavior:'smooth'});}}
}));
if(trustedEmbedded&&window.chrome&&window.chrome.webview){
 window.chrome.webview.addEventListener('message',event=>{
  const data=event.data;if(!data||data.type!=='orders-state'||!Array.isArray(data.items))return;
  const phases={available:say('Доступен','Available'),active:say('Принят','Accepted'),proof:say('Получено подтверждение','Proof obtained'),confirmed:say('Можно сдавать','Ready to turn in'),documents:say('Документы получены','Documents received'),paid:say('Выполнен','Completed'),lost:say('Закрыт','Closed')};
  for(const row of data.items){
   const button=[...document.querySelectorAll('[data-native-route]')].find(item=>item.dataset.nativeRoute===row.route);
   const card=button&&button.closest('.order-card');if(!card)continue;
   card.querySelector('h3').textContent=row.title;
   const description=card.querySelector('h3 + p');if(description)description.textContent=row.description;
   const goods=card.querySelector('ul');if(goods)goods.remove();
   const payment=card.querySelector('.order-payment');if(payment)payment.textContent=say('Награда ','Payment ')+row.pay+say(' руб.',' RU');
   let state=card.querySelector('.order-current');if(!state){state=document.createElement('p');state.className='order-current';state.setAttribute('role','status');card.insertBefore(state,button);}
   state.textContent=(phases[row.phase]||row.phase)+(row.detail?' · '+row.detail:'');
  }
  const note=document.querySelector('.orders-note');if(note)note.textContent=say('Условия и статус из текущего сохранения. Откройте карточку в ноутбуке для принятия или сдачи.','Terms and status from your current save. Open the laptop card to accept or turn in the order.');
 });
 window.chrome.webview.postMessage({action:'orders-state'});
}
// 0.47 unified, generated bilingual index: no network requests or live game queries.
const normal=s=>String(s||'').normalize('NFKC').toLocaleLowerCase(lang).replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function terms(q){const out=[];String(q||'').slice(0,120).replace(/"([^"]+)"|(\S+)/g,(_,phrase,word)=>{const v=normal(phrase||word);if(v)out.push(v);return '';});return out.slice(0,12);}
const index47=()=>window.FB47_SEARCH_INDEX||window.FB_INDEX||[];
function search(q,kind='all'){
 const words=terms(q);if(!words.length&&kind==='all')return [];
 return index47().filter(r=>kind==='all'||r.kind===kind).map(r=>{
  const d=r[lang]||r.ru;if(!d)return {r,score:0};
  const title=normal(d.title),tags=normal(d.tags),body=normal(d.title+' '+d.body+' '+(d.search||'')+' '+(d.tags||''));
  const tokens=body.split(' ');
  const matched=words.every(word=>body.includes(word)||(word.length>=4&&tokens.some(tok=>tok.startsWith(word))));
  return {r,score:matched?words.reduce((n,word)=>n+(title.includes(word)?8:tags.includes(word)?4:1),1):0};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.r.path.localeCompare(b.r.path));
}
const form=document.getElementById('network-search'),results=document.getElementById('search-results');
const categoryNames={creature:say('Бестиарий','Bestiary'),article:say('Полевой блог','Field journal'),diary:say('Дневники','Diaries'),guide:say('Руководство','Guide'),story:say('История','Story'),dossier:say('Досье','Dossier'),service:say('Локальный инструмент','Local tool'),order:say('Игровой заказ','In-game contract'),social:say('Связь','Social'),section:say('Раздел','Section')};
function showResults(query,kind='all'){
 if(!results)return;results.replaceChildren();if(!query.trim()&&kind==='all'){results.hidden=true;return;}results.hidden=false;
 const heading=document.createElement('h2');heading.textContent=say('Результаты поиска','Search results');results.append(heading);
 const found=search(query,kind),count=document.createElement('p');count.className='count';count.setAttribute('role','status');count.textContent=say('Найдено: ','Found: ')+found.length;results.append(count);
 if(!found.length){const p=document.createElement('p');p.textContent=say('Нет совпадений. Проверьте написание или снимите фильтр.','No matches. Try another spelling or remove the filter.');results.append(p);}
 for(const {r}of found){const d=r[lang]||r.ru,article=document.createElement('article');article.className='result';const a=document.createElement('a');a.href=base+r.path;a.textContent=d.title;
  const p=document.createElement('p');p.textContent=d.body.slice(0,220)+(d.body.length>220?'…':'');const source=document.createElement('p');source.className='meta';source.textContent=categoryNames[r.kind]||r.kind;
  article.append(source,a,p);results.append(article);}
}
if(form){
 const q=form.elements.q,category=form.elements.kind,params=new URLSearchParams(location.search);
 q.value=(params.get('q')||'').slice(0,120);if(category){const initial=params.get('kind')||'all';category.value=Array.from(category.options).some(o=>o.value===initial)?initial:'all';}
 showResults(q.value,category?category.value:'all');
 const apply=()=>{
  const query=q.value.trim().slice(0,120),kind=category?category.value:'all';showResults(query,kind);
  try{const u=new URL(location.href);if(query)u.searchParams.set('q',query);else u.searchParams.delete('q');if(kind!=='all')u.searchParams.set('kind',kind);else u.searchParams.delete('kind');history.pushState({},'',u);}catch{}
 };
 form.addEventListener('submit',event=>{event.preventDefault();const query=q.value.trim().slice(0,120),provider=form.elements.engine?form.elements.engine.value:'zone';
  if((provider==='google'||provider==='duckduckgo')&&query){location.href=(provider==='google'?'https://www.google.com/search?q=':'https://duckduckgo.com/?q=')+encodeURIComponent(query);return;}
  apply();if(results&&!results.hidden)results.scrollIntoView({block:'start',behavior:'smooth'});
 });
 if(category)category.addEventListener('change',apply);
 addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);q.value=params.get('q')||'';if(category){const kind=params.get('kind')||'all';category.value=Array.from(category.options).some(o=>o.value===kind)?kind:'all';}showResults(q.value,category?category.value:'all')});
}
const filter=document.getElementById('species-filter'),species=document.getElementById('species-search');
function filterCards(){const query=normal(species?species.value:''),group=filter?filter.value:'all';let count=0;document.querySelectorAll('[data-species]').forEach(card=>{const match=(group==='all'||card.dataset.group===group)&&normal(card.textContent).includes(query);card.hidden=!match;if(match)count++;});const output=document.getElementById('species-count');if(output)output.textContent=say('Показано записей: ','Records shown: ')+count;}
if(filter)filter.addEventListener('change',filterCards);if(species)species.addEventListener('input',filterCards);if(filter||species)filterCards();
window.FB_SEARCH={search,normal};
})();


;(()=>{'use strict';
const content=window.FB_PORTAL041||[],host=document.getElementById('portal041-directory');
if(!host)return;
const lang=document.documentElement.lang==='en'?'en':'ru',en=lang==='en';
const t=(r,e)=>en?e:r,localRoot=host.dataset.root||'./';
const home=localRoot+(en?'en/':'')+'directory.html';
const key='zonebook.portal041.';
const pick=(r,name)=>r[lang+'_'+name]||'';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=id=>home+'?entry='+encodeURIComponent(id);
const pageOf=id=>content.find(x=>x.id===id);
const normalize=s=>String(s||'').toLocaleLowerCase(lang).replace(/ё/g,'е').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const safeRead=id=>{try{return JSON.parse(localStorage.getItem(key+id))||{}}catch{return {}}};
const safeWrite=(id,value)=>{try{localStorage.setItem(key+id,JSON.stringify(value));return true}catch{return false}};
function nativeAction(route){
 if(location.origin==='https://network.zonebook.local'&&window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({action:'open-native',route});note(t('Открываем раздел ноутбука…','Opening the laptop section…'));}
 else note(t('Это действие доступно внутри игрового ZONEbook. Публичные материалы можно читать здесь.','This action requires the in-game ZONEbook laptop. Public content remains readable here.'));
}
function note(msg){let out=document.getElementById('portal041-global-status');if(!out){out=document.createElement('p');out.id='portal041-global-status';out.setAttribute('role','status');host.prepend(out);}out.textContent=msg}
const types={guide:t('Практическая памятка','Field guide'),story:t('Авторская история','Original story'),dossier:t('Редакционное досье','Editorial dossier'),service:t('Локальный инструмент','Local tool')};
function related(r){
 let html='';for(const id of r.related||[]){const item=pageOf(id);if(item)html+=`<a href="${link(id)}">${escape(pick(item,'title'))}</a>`;}
 return html;
}
function renderEntry(r){
 document.title=pick(r,'title')+' — F&B';
 const languageSwitch=document.querySelector('.topline a[lang]');
 if(languageSwitch){languageSwitch.href=(en?localRoot+'directory.html':localRoot+'en/directory.html')+'?entry='+encodeURIComponent(r.id);}
 const parts=(r[lang+'_sections']||[]).map(([title,body])=>`<section><h2>${escape(title)}</h2><p>${escape(body)}</p></section>`).join('');
 host.innerHTML=`<article class="portal041-entry" data-theme="${escape(r.theme)}">
 <div class="portal041-entry-hero"><a class="portal041-back" href="${home}">${t('← К каталогу','← Back to directory')}</a>
 <p class="eyebrow">F&B / ${escape(types[r.kind])} / 0.47 BETA1</p><h1>${escape(pick(r,'title'))}</h1><p class="lead">${escape(pick(r,'lead'))}</p></div>
 <div class="portal041-entry-content"><div class="portal041-entry-article">${parts}<div id="portal041-widget"></div></div>
 <aside class="portal041-entry-aside"><h3>${t('По теме','Related')}</h3>${related(r)}<p>${t('Архив F&B. Материалы не показывают текущую обстановку в вашей игре.','F&B archive. Content does not provide live game-state intelligence.')}</p></aside></div></article>`;
 if(r.kind==='service')renderTool(r);
}
function button(text,type='button'){return `<button type="${type}">${escape(text)}</button>`;}
function renderTool(r){
 const target=document.getElementById('portal041-widget');if(!target)return;
 const saved=safeRead(r.id);
 if(r.service==='checklist'){
  target.innerHTML=`<form class="portal041-form" id="portal041-tool"><h3>${t('Личная контрольная ведомость','Personal checklist')}</h3><div class="portal041-checks">${(r[lang+'_items']||[]).map((v,i)=>`<label><input type="checkbox" name="c${i}">${escape(v)}</label>`).join('')}</div><div class="portal041-actions">${button(t('Сбросить отметки','Clear ticks'))}</div><p class="portal041-state" role="status"></p></form>`;
  const f=target.querySelector('form'),checks=[...f.querySelectorAll('[type=checkbox]')],state=f.querySelector('.portal041-state');
  checks.forEach((c,i)=>{c.checked=!!(saved.values||[])[i]});
  const refresh=()=>{const vals=checks.map(c=>c.checked),ok=safeWrite(r.id,{values:vals});state.textContent=vals.filter(Boolean).length+'/'+vals.length+' · '+(ok?t('Сохранено в этом браузере','Saved in this browser'):t('Память браузера недоступна; отметки временные','Browser storage unavailable; ticks are temporary'))};
  checks.forEach(c=>c.addEventListener('change',refresh));f.querySelector('button').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);refresh()});refresh();return;
 }
 if(r.service==='loadout'){
  const metrics=[t('Боезапас','Ammunition'),t('Лечение','Medical'),t('Подвижность','Mobility'),t('Ремонт','Repair')];
  const selections=(prefix)=>metrics.map((metric,i)=>`<label>${escape(metric)}<select name="${prefix}${i}">${[1,2,3,4,5].map(n=>`<option value="${n}">${n} / 5</option>`).join('')}</select></label>`).join('');
  target.innerHTML=`<form class="portal041-form" id="portal041-tool"><div class="portal041-metrics"><fieldset><legend>${t('Комплект А','Kit A')}</legend><label>${t('Название','Name')}<input name="an" maxlength="75"></label>${selections('a')}</fieldset><fieldset><legend>${t('Комплект Б','Kit B')}</legend><label>${t('Название','Name')}<input name="bn" maxlength="75"></label>${selections('b')}</fieldset></div><div class="portal041-actions">${button(t('Сравнить','Compare'))}</div><p class="portal041-state" role="status"></p></form>`;
  const f=target.querySelector('form'),status=f.querySelector('.portal041-state');
  for(const el of f.elements)if(el.name&&saved[el.name]!=null)el.value=saved[el.name];
  const calc=()=>{
   const vals={};for(const e of f.elements)if(e.name)vals[e.name]=e.value;
   const a=metrics.reduce((sum,_,i)=>sum+Number(vals['a'+i]||0),0),b=metrics.reduce((sum,_,i)=>sum+Number(vals['b'+i]||0),0);
   const result=(vals.an||t('Комплект А','Kit A'))+': '+a+'/20; '+(vals.bn||t('Комплект Б','Kit B'))+': '+b+'/20. ';
   const ok=safeWrite(r.id,vals);
   status.textContent=result+t('Это ваша субъективная оценка, не статистика игры.','These are your subjective ratings, not game statistics.')+(ok?'':' '+t('Сохранение недоступно.','Storage unavailable.'));
  };f.querySelector('button').addEventListener('click',calc);return;
 }
 const fields=r.service==='route'?[
 ['origin',t('Откуда / локация','Origin / level')],['destination',t('Куда / ориентир','Destination / landmark')],['fallback',t('Запасной путь','Fallback path')],['risk',t('Известные риски и их источник','Known hazards and source')]
 ]:[['location',t('Место и игровое время','Location and game time')],['source',t('Источник (видел / слышал / пересказ)','Source (saw / heard / reported)')],['observation',t('Что произошло','What happened')],['confidence',t('Достоверность и давность','Confidence and age')]];
 target.innerHTML=`<form class="portal041-form" id="portal041-tool">${fields.map(([name,label],i)=>`<label>${escape(label)}${i<2?`<input name="${name}" maxlength="220" autocomplete="off">`:`<textarea name="${name}" maxlength="1200"></textarea>`}</label>`).join('')}
 <div class="portal041-actions">${button(t('Сохранить черновик','Save draft'))}${button(t('Скопировать текст','Copy text'))}${button(t('Очистить','Clear'))}</div><p class="portal041-state" role="status"></p></form>`;
 const f=target.querySelector('form'),state=f.querySelector('.portal041-state'),buttons=f.querySelectorAll('button');
 fields.forEach(([name])=>{f.elements[name].value=saved[name]||''});
 const read=()=>Object.fromEntries(fields.map(([name])=>[name,f.elements[name].value]));
 const summary=()=>fields.map(([name,label])=>label+': '+f.elements[name].value.trim()).join('\n');
 buttons[0].addEventListener('click',()=>{state.textContent=safeWrite(r.id,read())?t('Черновик сохранён локально.','Draft saved locally.'):t('Профиль браузера не разрешил сохранять данные.','Browser storage denied writing data.')});
 buttons[1].addEventListener('click',async()=>{const text=summary();try{if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('No clipboard');await navigator.clipboard.writeText(text);state.textContent=t('Текст скопирован. Публикация не выполнялась.','Text copied. Nothing has been posted.')}catch{state.textContent=t('Копирование недоступно. Выделите текст ниже вручную:','Copy unavailable. Select the text below:')+'\n'+text}});
 buttons[2].addEventListener('click',()=>{fields.forEach(([name])=>f.elements[name].value='');safeWrite(r.id,{});state.textContent=t('Черновик очищен.','Draft cleared.')});
}
function renderCatalog(){
 document.title=t('Каталог сайтов — F&B','Site directory — F&B');
 const languageSwitch=document.querySelector('.topline a[lang]');
 if(languageSwitch)languageSwitch.href=en?localRoot+'directory.html':localRoot+'en/directory.html';
 const items=[
  ...content, ...(window.FB47_CATALOG||[]),
  {id:'bestiary',kind:'guide',ru_title:'Атлас мутантов',en_title:'Mutant atlas',ru_lead:'Поведение, полевые признаки и опасности без выдуманных игровых цифр.',en_lead:'Behaviour, field signs and risks without invented statistics.',path:'bestiary/index.html'},
  {id:'survival',kind:'guide',ru_title:'За Периметром',en_title:'Beyond the Perimeter',ru_lead:'Полевой блог об укрытии, вылазках и возвращении.',en_lead:'Field articles about shelters, expeditions and returning.',path:'survival/index.html'},
  {id:'diaries',kind:'story',ru_title:'Они не вернулись',en_title:'They Never Returned',ru_lead:'Письма, показания и пропавшие люди.',en_lead:'Letters, testimony and missing people.',path:'diaries/index.html'},
  {id:'trapper',kind:'order',ru_title:'Охота Зверобоя',en_title:'Trapper contracts',ru_lead:'Публичные карточки заказов; принятие внутри игры.',en_lead:'Public order cards; acceptance requires the game.',path:'orders/trapper/index.html'},
  {id:'hawaiian',kind:'order',ru_title:'Снабжение Гавайца',en_title:'Hawaiian supply desk',ru_lead:'Заказные поставки и требования предметов.',en_lead:'Supply orders and item requirements.',path:'orders/hawaiian/index.html'},
  {id:'freedom',kind:'order',ru_title:'Курьер Свободы',en_title:'Freedom courier',ru_lead:'Адресные поручения и игровые условия.',en_lead:'Courier assignments with in-game conditions.',path:'orders/freedom/index.html'},
  {id:'checkpoint',kind:'order',ru_title:'Блокпост',en_title:'Checkpoint',ru_lead:'Карточки контрольного пункта; действия через ноутбук.',en_lead:'Checkpoint order cards; actions through the laptop.',path:'orders/checkpoint/index.html'},
  {id:'snorkgram',kind:'social',ru_title:'SnorkGram',en_title:'SnorkGram',ru_lead:'Подключение к общему серверу и локальные возможности.',en_lead:'Shared-server connection and local features.',path:'snorkgram/index.html'}
 ];
 const hero=document.querySelector('.portal041-directory-hero');
 host.innerHTML='';if(hero)host.append(hero);
 const bar=document.createElement('div');bar.className='portal041-toolbar';
 bar.innerHTML=`<label>${t('Поиск по страницам','Search pages')}<input id="portal041-filter" type="search" maxlength="100" placeholder="${t('Тема, название, материал','Topic, title, text')}"></label>
 <label>${t('Категория','Category')}<select id="portal041-category"><option value="all">${t('Все разделы','All categories')}</option><option value="guide">${t('Памятки','Guides')}</option><option value="story">${t('Истории','Stories')}</option><option value="service">${t('Инструменты','Tools')}</option><option value="dossier">${t('Досье','Dossiers')}</option><option value="order">${t('Заказы','Orders')}</option><option value="social">${t('Связь','Social')}</option></select></label>`;
 host.append(bar);
 const stats=document.createElement('p');stats.className='portal041-stats';host.append(stats);
 const list=document.createElement('div');list.className='portal041-list';host.append(list);
 const filter=bar.querySelector('input'),category=bar.querySelector('select');
 const q=new URLSearchParams(location.search).get('q');if(q)filter.value=q.slice(0,100);
 const update=()=>{
  const val=normalize(filter.value),kind=category.value;list.replaceChildren();let n=0;
  items.forEach(r=>{
   if(kind!=='all'&&r.kind!==kind)return;
   const body=pick(r,'title')+' '+pick(r,'lead')+' '+(r[lang+'_sections']||[]).flat().join(' ');
   if(val&&val.split(' ').some(word=>!normalize(body).includes(word)))return;
   const tile=document.createElement('article');tile.className='portal041-tile';
   const title=document.createElement('h3'),a=document.createElement('a');a.href=r.path?localRoot+(en?'en/':'')+r.path:link(r.id);a.textContent=pick(r,'title');title.append(a);
   const type=document.createElement('div');type.className='portal041-type';type.textContent=types[r.kind]||(r.kind==='order'?t('Игровые заказы','In-game contracts'):t('Связь','Social'));
   const p=document.createElement('p');p.textContent=pick(r,'lead');tile.append(type,title,p);list.append(tile);n++;
  });
  stats.textContent=t('Доступно материалов: ','Visible pages: ')+n;
  if(!n){const p=document.createElement('p');p.className='portal041-empty';p.textContent=t('Ничего не найдено. Снимите фильтр или измените запрос.','No results. Clear filters or try another query.');list.append(p)}
 };
 bar.addEventListener('input',update);bar.addEventListener('change',update);update();
 const legacy=document.createElement('details');legacy.className='portal041-native';
 const sm=document.createElement('summary');sm.textContent=t('Игровые сервисы ZONEbook (без самостоятельных веб-страниц)','ZONEbook in-game services (no independent web pages)');legacy.append(sm);
 const note=document.createElement('p');note.className='portal041-native-note';note.textContent=t('Ниже перечислены команды ноутбука из 0.36. Их наличие и доступность определяются установленными компонентами; это не отдельные публичные сайты.','The controls below come from the 0.36 laptop. Availability depends on installed components; these are not separate public websites.');legacy.append(note);
 const natives=window.FB_NATIVE041||[];
 natives.forEach(r=>{const b=document.createElement('button');b.type='button';b.textContent=r.name;b.addEventListener('click',()=>nativeAction(r.route));legacy.append(b)});
 host.append(legacy);
}
const selection=new URLSearchParams(location.search).get('entry');const r=selection&&pageOf(selection);
if(r)renderEntry(r);else {renderCatalog(); if(selection)note(t('Страница не найдена: показан каталог.','Page not found: showing the directory.'));}
})();
