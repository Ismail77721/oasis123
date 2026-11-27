(function(){
 const P=OasisProduction38,$=id=>document.getElementById(id);
 function elem(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
 MainScene.prototype.openProduction38=function(i){
  const t=this.s.tiles[i],coop=t.building==='coop',root=$('farm-actions');root.replaceChildren();this.openFarmIndex=i;
  $('farm-title').textContent=OASIS_BUILDINGS[t.building].title;$('farm').hidden=false;$('farm-error').hidden=true;$('farm-status').textContent='';
  const choices=elem('div',null,'recipes'),stock=elem('div',null,'needs'),status=elem('div',null,'summaryline'),run=elem('button',null,'farm-primary');
  if(!coop){for(const id of ['flat','loaf','bun']){const b=elem('button'),img=elem('img');img.src='assets/ui38/'+id+'.webp';img.alt='';b.dataset.recipe=id;b.append(img,elem('span',P.goods[id].title));b.onclick=()=>{if(t.productionAt)return;t.recipe38=id;this.save();this.updateFarmStatus();};choices.append(b);}root.append(choices);}
  root.append(stock,status,run);let signature='';
  this.updateFarmStatus=()=>{
   const id=P.selected(t),r=P.goods[id],busy=!!t.productionAt,seconds=Math.max(0,Math.ceil((t.productionAt-Date.now())/1000));
   const key=[id,busy,...Object.keys(r.inputs).map(k=>this.s.inventory[k]||0)].join('/');
   if(key!==signature){signature=key;stock.replaceChildren();if(!busy){
    const line=(a,b,c)=>{const row=elem('div',null,'line');for(const x of [a,b,c])row.append(elem('span',String(x)));stock.append(row);};
    line(coop?'Корм':'Ингредиенты','Нужно','В амбаре');for(const [k,q] of Object.entries(r.inputs))line(P.goods[k]?.title||OasisFamilyLand.labels(k),q,this.s.inventory[k]||0);
   }for(const b of choices.children){b.disabled=busy;b.setAttribute('aria-pressed',String(b.dataset.recipe===id));}}
   status.textContent=busy?(seconds?'До готовности · '+seconds+' с':'Можно собрать'):r.title+' × '+r.amount+' · '+Math.round(r.min*60/(1+.1*((t.buildingLevel||1)-1)))+' с';
   run.disabled=busy?seconds>0:!P.enough(this.s,t);run.textContent=busy?(seconds?'Производство идёт':coop?'Забрать яйца':'Забрать выпечку'):coop?'Насыпать корм':'Начать выпечку';
  };
  run.onclick=()=>{const collect=!!t.productionAt;if(!P.cycle(this.s,t,collect?'collect':'feed',Date.now()).ok)return;this.audio?.play(coop?(collect?'eggs38':'feed38'):(collect?'bread38':'cook38'));this.notify(collect?'Продукция добавлена в амбар':'Производство началось');this.save();this.render();this.updateFarmStatus();};
  this.updateFarmStatus();
 };
})();
