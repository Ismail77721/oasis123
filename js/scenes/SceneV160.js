/* v1.6 — independent UI layer for household, land purchases, storage and orders. */
(function(){
'use strict';
const MP=MainScene.prototype,L=window.OasisFamilyLand,C=window.OASIS_CONFIG,B=window.OASIS_BUILDINGS;
const oldCreate=MP.create,oldRender=MP.render,oldTap=MP.onMapTap,oldGoBack=MP.goBack;
const oldClosePanels=MP.closeAllPanels,oldMarket=MP.renderMarketTab,oldMenu=MP.openMainMenu,oldName=MP.productName;
function el(id){return document.getElementById(id);}
function text(id,value){const item=el(id);if(item)item.textContent=value;}
function formatTime(seconds){const m=Math.max(0,Math.ceil(seconds/60));return m>=60?Math.floor(m/60)+' ч '+(m%60)+' мин':m+' мин';}
function node(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!=null)n.textContent=content;return n;}
function line(parent,name,count){const n=node('div','storage-line');n.append(node('span',null,name),node('b',null,String(count)));parent.append(n);}
function group(parent,title){const n=node('section','storage-group');n.append(node('h3',null,title));parent.append(n);return n;}
function marketRow(ctx,title,desc,buttons){return ctx.marketRow(title,desc,buttons);}
function currentStock(s,item){return item.category==='seed'?s.seedBank[item.id]||0:s.inventory[item.id]||0;}
function itemLabel(item){return (item.category==='seed'?'🌱 ':L.icons(item.id)+' ')+(item.category==='seed'?'Семена '+L.labels(item.id):L.labels(item.id));}
MP.create=function(){oldCreate.call(this);L.ensure(this.s);
 const stop=el('stop-build');if(stop)stop.addEventListener('click',()=>{this.updateEditClock?.(Date.now());this.s.tool='plant';this.resetEditDraft?.();this.save();this.render();this.notify('Режим строительства завершён');});
 el('home-close')?.addEventListener('click',()=>this.closeHome());
 el('home-panel')?.addEventListener('click',e=>{if(e.target===el('home-panel'))this.closeHome();});
 el('reply-modal-close')?.addEventListener('click',()=>{el('reply-modal').hidden=true;});
 el('family-hud')?.addEventListener('click',()=>this.openHome());
 this.render();
};
MP.closeHome=function(){if(el('home-panel'))el('home-panel').hidden=true;};
MP.closeAllPanels=function(){oldClosePanels.call(this);this.closeHome();};
MP.openMainMenu=function(){this.closeHome();el('reply-modal').hidden=true;return oldMenu.call(this);};
MP.goBack=function(){if(!el('reply-modal').hidden){el('reply-modal').hidden=true;return;}
 if(!el('home-panel').hidden){this.closeHome();return;}return oldGoBack.call(this);
};
MP.showBlessing=function(message){text('reply-modal-text',message||'Да воздаст тебе Аллах благом!');el('reply-modal').hidden=false;};
MP.productName=function(id){if(L.labels(id)!==id)return L.icons(id)+' '+L.labels(id);return oldName.call(this,id);};
MP.openHome=function(){if(!this.s)return;this.closeAllPanels();this.renderHome();el('home-panel').hidden=false;this.playSound?.('click');};
MP.renderHome=function(){L.ensure(this.s);
 const s=this.s,f=s.family,level=s.house.level,side=L.houseSide(s.house);
 text('home-intro','Семейный дом · уровень '+level+'/5 · дворик '+side+'×'+side+' клетки');
 const panel=el('home-family');panel.replaceChildren();
 const section=node('section','home-section');section.append(node('h3',null,'🍲 Потребности семьи'));
 if(f.met){section.append(node('p',null,'✅ Семья обеспечена. Следующая потребность через '+formatTime((f.nextDueAt-Date.now())/1000)+'.'));}
 else{section.append(node('p',null,'Продукты требуются один раз за игровые сутки (2 реальных часа). Недостающую еду можно купить, а выращенную — передать из амбара.'));
  const stock=node('div','home-stock');for(const need of f.needs){const count=s.inventory[need.id]||0;const span=node('span',null,L.icons(need.id)+' '+L.labels(need.id)+' '+Math.min(count,need.amount)+'/'+need.amount);stock.append(span);}section.append(stock);
  const feedBtn=node('button','home-action','🍲 Передать продукты семье');feedBtn.disabled=f.needs.some(need=>(s.inventory[need.id]||0)<need.amount);
  feedBtn.addEventListener('click',()=>{const result=L.feed(s);this.notify(result.ok?'Семья получила продукты':result.reason);if(result.ok){this.playSound?.('collect');this.save();this.render();}this.renderHome();});section.append(feedBtn);
  const buyBtn=node('button','home-action','🛒 Докупить недостающую еду');buyBtn.disabled=f.needs.every(n=>(s.inventory[n.id]||0)>=n.amount);
  buyBtn.addEventListener('click',()=>{const result=L.buyFood(s);this.notify(result.ok?'Куплены продукты за '+result.cost+' 🪙':result.reason);if(result.ok){this.save();this.playSound?.('coin');this.render();}this.renderHome();});section.append(buyBtn);
 }
 const score=node('p','home-muted','Семья обеспечена '+(f.provided||0)+' раз · настроение '+Math.floor(f.happiness||0)+'%');section.append(score);panel.append(section);
 const upgrades=el('home-upgrades');upgrades.replaceChildren();const up=node('section','home-section');up.append(node('h3',null,'🏠 Улучшение дома'));
 const prices=[0,160,380,800,1500],price=prices[level];up.append(node('p',null,'Улучшения добавляют элементы двора и делают дом более уютным. Максимальный уровень — 5.'));
 const button=node('button','home-action',level>=5?'Дом полностью улучшен':'Улучшить до уровня '+(level+1)+' · '+price+' 🪙');button.disabled=level>=5||s.coins<price;
 button.addEventListener('click',()=>{const result=L.upgradeHome(s);this.notify(result.ok?'Дом улучшен до уровня '+result.level:result.reason);if(result.ok){this.save();this.playSound?.('build');this.render();}this.renderHome();});up.append(button);upgrades.append(up);
 const land=el('home-land');land.replaceChildren();const area=node('section','home-section');area.append(node('h3',null,'🌾 Расширение земли'));
 area.append(node('p',null,'Сейчас доступно '+s.worldSize+'×'+s.worldSize+' участков. При покупке ферма растёт наружу, а существующие посадки, каналы и здания остаются на месте.'));
 const priceLand=L.expansionPrice(s);const expandButton=node('button','home-action',priceLand===null?'Вся территория открыта':'Расширить до '+(s.worldSize+4)+'×'+(s.worldSize+4)+' · '+priceLand+' 🪙');
 expandButton.disabled=priceLand===null||s.coins<priceLand;expandButton.addEventListener('click',()=>{
  const result=L.expand(s);if(!result.ok){this.notify(result.reason);this.renderHome();return;}
  // Old sprites are stored by tile index; invalidate after reindexing all tiles.
  for(const sprite of (this.art||[]))if(sprite&&typeof sprite.destroy==='function')sprite.destroy();this.art=[];
  this.selectedTile=null;this.panX=0;this.panY=0;this.mapZoom=Math.max(1.05,(this.mapZoom||1)*.92);this.clampPan?.();
  this.save();this.render();this.renderHome();this.playSound?.('build');this.notify('Ферма расширена до '+result.newSize+'×'+result.newSize+'!');
 });area.append(expandButton);land.append(area);
};
MP.openStorage=function(){L.ensure(this.s);const target=el('storage-items');target.replaceChildren();
 const seeds=group(target,'🌱 Семена и саженцы');for(const [id,c] of Object.entries(C.crops))line(seeds,c.icon+' '+c.title,this.s.seedBank[id]||0);
 const raw=group(target,'🧺 Сырьё');for(const [id,c] of Object.entries(C.crops))line(raw,c.icon+' '+c.title,this.s.inventory[id]||0);
 for(const id of ['wool','camelMilk'])line(raw,L.icons(id)+' '+L.labels(id),this.s.inventory[id]||0);
 const products=group(target,'📦 Готовая продукция');for(const b of Object.values(B))if(!['wool','camelMilk'].includes(b.product))line(products,L.icons(b.product)+' '+L.labels(b.product),this.s.inventory[b.product]||0);
 el('storage-screen').hidden=false;
};
MP.renderMarketTab=function(stall='produce'){
 if(!['orders','sadaka'].includes(stall))return oldMarket.call(this,stall);
 this.currentStall=stall;
 document.querySelectorAll('.market-stall').forEach(b=>b.classList.toggle('selected',b.dataset.stall===stall));
 const rows=el('market-items');rows.replaceChildren();this.marketNotice('');OasisUI.currency(el('market-coins'),this.s.coins);
 if(stall==='orders'){
  this.guideEvent('orders');text('market-section-title','📜 Доска заказов');text('market-section-desc','Отгружай один или несколько видов товаров. Составные заказы оплачиваются выше обычной продажи.');text('market-location','Доска заказов');
  window.OasisEconomy.ensureOrders(this.s);
  this.s.orders.forEach((order,index)=>{
   const items=order.items||[{id:order.id,quantity:order.quantity,category:'raw'}];
   const title=order.kind+' · '+items.map(x=>L.icons(x.id)+' '+L.labels(x.id)+' ×'+x.quantity).join(' + ');
   const detail=items.map(x=>itemLabel(x)+' '+Math.min(currentStock(this.s,x),x.quantity)+'/'+x.quantity).join(' · ')+' · награда '+order.reward+' 🪙';
   rows.append(marketRow(this,title,detail,[{text:'Отгрузить',disabled:items.some(x=>currentStock(this.s,x)<x.quantity),onClick:()=>{
    const result=window.OasisEconomy.completeOrder(this.s,index);if(!result.ok){this.marketNotice(result.reason);return;}
    this.save();this.render();this.renderQuests();this.renderMarketTab('orders');this.playSound?.('coin');this.marketNotice('Заказ отправлен! Получено '+result.net+' монет');
   }}]));
  });return;
 }
 text('market-section-title','🤲 Садака');text('market-section-desc','Помощь тем, кто оказался в трудном положении.');text('market-location','Просьбы о помощи');
 for(const req of OasisSadaka.list(this.s)){
  const detail=req.description+' · '+(req.coins?req.coins+' 🪙':req.amount+' × '+this.productName(req.goods));
  const enough=req.coins?this.s.coins>=req.coins:(this.s.inventory[req.goods]||0)>=req.amount;
  rows.append(marketRow(this,'🤲 '+req.title,detail,[{text:req.done?'Помощь оказана':'Помочь',disabled:req.done||!enough,onClick:()=>{
   const result=OasisSadaka.donate(this.s,req.id); // IMPORTANT: id, not undefined key.
   if(!result.ok){this.marketNotice(result.reason);return;}
   this.save();this.render();this.renderMarketTab('sadaka');this.playSound?.('quest');
   const quotes=['Да воздаст тебе Аллах благом!','Пусть Аллах примет твою помощь!','Пусть Аллах дарует тебе благо!'];
   this.showBlessing(quotes[Math.abs([...req.id].reduce((a,c)=>a+c.charCodeAt(0),0))%quotes.length]);
  }}]));
 }
};
MP.onMapTap=function(pointer){if(this.s?.house&&this.cells?.length){
  let hit=null,score=Infinity;
  for(const cell of this.cells){const d=Math.abs(pointer.x-cell.x)/(cell.w/2)+Math.abs(pointer.y-cell.y)/(cell.h/2);
   if(d<=1&&d<score){hit=cell;score=d;}
  }
  if(hit&&L.isHome(this.s,hit.i)){this.openHome();return;}
  const b=this.homeHit;
  if(b&&pointer.x>=b.left&&pointer.x<=b.right&&pointer.y>=b.top&&pointer.y<=b.bottom){this.openHome();return;}
 }return oldTap.call(this,pointer);};
MP.drawHouseImage=function(){
 if(!this.s?.house||!this.cells?.length)return;
 const indices=L.footprint(this.s),cells=indices.map(i=>this.cells.find(c=>c.i===i));
 if(cells.some(c=>!c))return;
 const centerX=cells.reduce((a,c)=>a+c.x,0)/cells.length,centerY=cells.reduce((a,c)=>a+c.y,0)/cells.length;
 const tw=cells[0].w,th=cells[0].h,level=this.s.house.level||1;
 const side=L.houseSide?.(this.s.house)||4,w=tw*side*.94,key='art-home-'+level;
 const source=this.textures?.exists?.(key)?this.textures.get?.(key)?.getSourceImage?.():null;
 const h=w*(source?.width?source.height/source.width:.8);
 const baseline=centerY+th*(side/2-.15);
 if(this.textures?.exists?.(key)&&this.add?.image){
  if(!this.homeSprite){this.homeSprite=this.add.image(centerX,centerY,key).setOrigin(.5,.91);}
  if(this.homeSprite.texture.key!==key)this.homeSprite.setTexture(key);
  this.homeSprite.setOrigin(.5,this.cache.json.get('approved-art-meta')?.['home-l'+Math.min(level,3)]?.anchor?.[1]||.95);
  this.homeSprite.setFlipX?.(Boolean(this.s.house.flipped));
  this.homeSprite.setDisplaySize(w,h).setPosition(centerX,baseline).setDepth(110+Math.round(baseline));
  if(OasisTimeSystem.getPhase()==='night')this.homeSprite.setTint(0xb2b6c8);else this.homeSprite.clearTint();
 }else{
  const g=this.g;g.fillStyle(0xb87e4e);g.fillRect(centerX-tw*.6,centerY-th*1.3,tw*1.2,th*1.2);
  g.fillStyle(0x814f31);g.fillTriangle(centerX-tw*.7,centerY-th*1.3,centerX,centerY-th*2,centerX+tw*.7,centerY-th*1.3);
 }
 this.homeHit={left:centerX-w*.31,right:centerX+w*.31,top:centerY-h*.50,bottom:centerY+h*.13};
};
MP.render=function(){if(!this.s)return;L.ensure(this.s);if(this.art?.length>this.s.tiles.length){for(const sprite of this.art.slice(this.s.tiles.length))sprite?.destroy?.();this.art.length=this.s.tiles.length;}oldRender.call(this);
 // Replace the old cluttered lower status line with a compact top status strip.
 const seeds=Object.values(this.s.seedBank||{}).reduce((a,b)=>a+(+b||0),0);
 const stock=Object.values(this.s.inventory||{}).reduce((a,b)=>a+(+b||0),0);
 const canals=this.s.tiles.filter(t=>t.canal).length;
 text('family-hud','Ур. '+this.getLevel()+'/20 · 🌱 '+seeds+' · 📦 '+stock+' · 💧 Каналы '+canals);
 text('inventory','');
 el('stop-build').hidden=this.s.tool==='plant';
 this.drawHouseImage();
};
})();
