/* ОАЗИС 1.7: sadaqa screens, campaign contributions, matching replies. */
(function(){'use strict';
 window.OASIS_CONFIG.version='1.7.0';
 const MP=MainScene.prototype,S=window.OasisSadaka,L=window.OasisFamilyLand;
 const oldMarketTab=MP.renderMarketTab,oldBlessing=MP.showBlessing,oldRender=MP.render;
 const get=id=>document.getElementById(id);
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const coins=n=>Math.max(0,Math.floor(n||0)).toLocaleString('ru-RU');
 function statusText(req){
  if(req.coins)return 'Нужна помощь: '+req.coins+' 🪙';
  const label=L.labels(req.goods);return 'Нужно: '+L.icons(req.goods)+' '+label+' × '+req.amount;
 }
 MP.showBlessing=function(value){
  let data=typeof value==='object'&&value?value:{text:String(value||'Да воздаст тебе Аллах благом!')};
  const known=S.BLESSINGS.find(q=>q.text===data.text);
  const reply=data.reply||known?.reply||'Амин';
  oldBlessing.call(this,data.text);
  const button=get('reply-modal-close');if(button){button.textContent=reply;button.setAttribute?.('aria-label',reply);}
 };
 MP.renderMarketTab=function(stall='produce'){
  if(stall!=='sadaka')return oldMarketTab.call(this,stall);
  const save=this.s,previousWave=save.charity?.wave;
  const requests=S.list(save),projects=S.projects(save);
  if(previousWave!==save.charity.wave||previousWave===undefined)this.save();
  this.lastCharityWave=save.charity.wave;
  this.currentStall='sadaka';
  document.querySelectorAll('.market-stall').forEach(b=>b.classList.toggle('selected',b.dataset.stall==='sadaka'));
  get('market-section-title').textContent='🤲 Садака';
  get('market-section-desc').textContent='Помощь семьям и общественным проектам. Выбирай, кому и сколько помочь.';
  get('market-location').textContent='Помощь и добрые дела';
  get('market-coins').textContent='🪙 '+coins(save.coins);
  const rows=get('market-items');rows.replaceChildren();this.marketNotice('');
  const requestHeader=node('div','charity-heading');requestHeader.append(node('h3',null,'🤲 Просьбы о помощи'));
  const dayCountdown=Math.max(0,save.charity.nextRefreshDay-S.gameDay(save));
  requestHeader.append(node('small',null,'Новые обращения через '+dayCountdown+' '+(dayCountdown===1?'игровой день':'игровых дня')+' · сутки = 2 часа'));
  rows.append(requestHeader);
  for(const req of requests){
   const enough=req.coins?save.coins>=req.coins:(save.inventory?.[req.goods]||0)>=req.amount;
   const description=req.description+' · '+statusText(req);
   rows.append(this.marketRow('🤲 '+req.title,description,[{
    text:req.done?'Помощь оказана':'Помочь',disabled:req.done||!enough,onClick:()=>{
     const result=S.donate(save,req.id);
     if(!result.ok){this.marketNotice(result.reason);return;}
     this.save();this.render();this.renderMarketTab('sadaka');this.playSound?.('quest');
     this.showBlessing(result.blessing);
    }
   }]));
  }
  const projectsHeader=node('div','charity-heading charity-projects-heading');
  projectsHeader.append(node('h3',null,'🏛️ Общественные проекты'));
  projectsHeader.append(node('small',null,'Сборы не обнуляются. Можно пожертвовать даже одну монету.'));
  rows.append(projectsHeader);
  for(const p of projects){
   const section=node('section','charity-project');section.dataset.projectId=p.id;
   const heading=node('div','charity-project-header');
   heading.append(node('strong',null,p.icon+' '+p.title),node('span',null,coins(p.raised)+' / '+coins(p.goal)+' 🪙'));
   section.append(heading,node('p','charity-project-desc',p.description));
   const progress=node('div','charity-progress');progress.setAttribute?.('role','progressbar');progress.setAttribute?.('aria-valuemin','0');progress.setAttribute?.('aria-valuemax',String(p.goal));progress.setAttribute?.('aria-valuenow',String(p.raised));
   const fill=node('div','charity-progress-fill');fill.style.width=Math.min(100,100*p.raised/p.goal)+'%';progress.append(fill);section.append(progress);
   if(p.completed){section.append(node('p','charity-done','✓ Сбор завершён. Спасибо всем, кто помог!'));rows.append(section);continue;}
   const row=node('div','charity-contribution');
   const field=node('input','charity-amount');field.type='number';field.min='1';field.max=String(Math.min(p.remaining,Math.floor(save.coins)));field.step='1';
   field.inputMode='numeric';field.value=String(Math.max(1,Math.min(50,p.remaining,Math.floor(save.coins))));field.setAttribute?.('aria-label','Сумма помощи для проекта «'+p.title+'»');
   const give=node('button','charity-submit','Помочь');give.type='button';give.disabled=save.coins<1;
   const donateAmount=amount=>{
    const result=S.contribute(save,p.id,amount);
    if(!result.ok){this.marketNotice(result.reason);return;}
    this.save();this.render();this.renderMarketTab('sadaka');this.playSound?.('quest');this.showBlessing(result.blessing);
   };
   give.addEventListener('click',()=>donateAmount(field.value));row.append(field,give);section.append(row);
   const quick=node('div','charity-quick');
   for(const amount of [10,50,200]){
    const btn=node('button','charity-quick-btn',amount+' 🪙');btn.type='button';btn.disabled=amount>save.coins||amount>p.remaining;
    btn.addEventListener('click',()=>donateAmount(amount));quick.append(btn);
   }
   const remaining=node('small','charity-remaining','Осталось собрать '+coins(p.remaining)+' 🪙');
   section.append(quick,remaining);rows.append(section);
  }
 };
 MP.render=function(){
  oldRender.call(this);
  if(!this.s||!this.marketOpen||this.currentStall!=='sadaka')return;
  const current=this.s.charity?.wave;
  S.ensure(this.s);
  if(this.s.charity.wave!==current)this.renderMarketTab('sadaka');
 };
})();
