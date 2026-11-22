(function(){
'use strict';
const M=MainScene.prototype,$=id=>document.getElementById(id);
const cart=document.createElement('img');cart.src='assets/ui37/cart.webp';
function drawCart(g,x,ground,size,angle){
 g.save();g.translate(x,ground);g.scale(size,size);
 const height=1.8*cart.naturalHeight/cart.naturalWidth;
 g.drawImage(cart,0,-.16-height,1.8,height);
 for(const axle of [.245,1.075]){
 g.save();g.translate(axle,-.195);g.scale(.65,.65);g.rotate(angle);
 function ring(radius,width,color){g.beginPath();g.arc(0,0,radius,0,2*Math.PI);g.lineWidth=width;g.strokeStyle=color;g.stroke()}
 for(let i=0;i<10;i++){g.rotate(Math.PI/5);g.beginPath();g.moveTo(0,0);g.lineTo(0,-.265);g.strokeStyle='#74451e';g.lineWidth=.035;g.stroke();g.lineWidth=.014;g.strokeStyle='#d29849';g.stroke()}
 ring(.267,.066,'#55371e');ring(.267,.046,'#be8139');ring(.285,.009,'#edb363');ring(.044,.034,'#8d551f');g.fillStyle='#e5b568';g.beginPath();g.arc(0,0,.031,0,2*Math.PI);g.fill();g.restore();
 }
 g.restore()
}
M.travelToMarket=function(stall){
 if(this.marketOpen||this.travelling37||this.v3Blocked)return;
 const panel=$('trip37'),canvas=panel.querySelector('canvas'),g=canvas.getContext('2d');
 this.travelling37=true;this.audio?.setContext('travel');panel.hidden=false;
 this.audio?.play('v37_trip');const start=performance.now();
 const frame=now=>{
  if(this.v3Blocked||!$('start-menu').hidden){panel.hidden=true;this.travelling37=false;this.render();return;}
  const w=panel.clientWidth,h=panel.clientHeight,ratio=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
  const t=Math.min(1,(now-start)/3800),size=Math.min(h*.37,w*.28),ground=h*.72,distance=w*.88-size*1.8;
  if(g){g.setTransform(ratio,0,0,ratio,0,0);g.clearRect(0,0,w,h);g.fillStyle='#d6ad6d';g.fillRect(0,ground,w,h*.035);
   if(cart.naturalWidth)drawCart(g,w*.06+t*distance,ground,size,t*distance/(size*.195));}
  if(t<1){requestAnimationFrame(frame);return;}
  panel.hidden=true;this.travelling37=false;this.openMarket(stall);
 };
 requestAnimationFrame(frame);
};
function labelledImage(element,key,title){
 if(!element)return;
 const image=document.createElement('img');image.className='item-icon35';image.alt='';image.src='assets/ui37/'+key+'.webp';
 element.replaceChildren(image,document.createTextNode(' '+title));
}
const tab=M.renderMarketTab;
M.renderMarketTab=function(stall='produce'){
 const entering=this.currentStall!==stall;
 tab.call(this,stall);
 if(!this.marketOpen||stall==='square')return;
 this.audio?.setContext('shop');
 if(entering)this.audio?.play('v37_'+stall);
 if(stall==='seeds')labelledImage($('market-section-title'),'seed-watermelon','Семенная лавка');
 const catalog=stall==='tools'?OASIS_TOOLS:stall==='produce'?OASIS_CONFIG.crops:null;
 if(catalog)for(const title of $('market-items').querySelectorAll('.item-title')){
  const match=Object.entries(catalog).find(([,item])=>title.textContent.trim().endsWith(item.title));
  if(match&&(stall!=='tools'||['rake','spade','shears','vessel'].includes(match[0])))labelledImage(title,match[0],match[1].title);
 }
};
const square=M.showMarketSquare;M.showMarketSquare=function(){square.call(this);if(this.marketOpen)this.audio?.setContext('market');};
// Cache small texture levels so distant roofs, fields and fence-side objects stay legible.
const place=M.placeCartoon;
M.placeCartoon=function(sprite,key,...geometry){
 const result=place.call(this,sprite,key,...geometry);
 const source='cartoon-'+key,target=Math.max(result.displayWidth,result.displayHeight);
 if(target>96||!this.textures.exists(source))return result;
 const level=Math.max(8,2**Math.ceil(Math.log2(Math.max(1,target)*1.4)));
 const id=source+'-far-'+level;
 if(!this.textures.exists(id)){
  const image=this.textures.get(source).getSourceImage(),longest=Math.max(image.width,image.height);
  if(longest<=level)return result;
  const texture=this.textures.createCanvas(id,Math.max(1,Math.round(image.width*level/longest)),Math.max(1,Math.round(image.height*level/longest)));
  if(!texture)return result;
  const ctx=texture.getContext();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(image,0,0,texture.width,texture.height);texture.refresh();
 }
 const width=result.displayWidth,height=result.displayHeight;
 return result.setTexture(id).setDisplaySize(width,height);
};
const create=M.create;
M.create=function(){
 create.call(this);
 for(const [action,key] of Object.entries({build:'build',inventory:'barn',quests:'quests',market:'trip'})){
  const img=document.querySelector('#toolbar [data-action="'+action+'"] img');
  if(img)img.src='assets/ui37/'+key+'.webp';
 }
 const card=$('settings-v3').querySelector('.market-card'),sound=$('sound-settings');
 card.insertBefore(sound,$('parent-open'));sound.hidden=false;
 const parent=$('parent-open'),note=parent.nextElementSibling;
 if(note?.tagName==='P')note.hidden=true;
 const links=$('start-menu').querySelector('.v3-menu-links');
 links.prepend($('menu-about'));$('menu-about').textContent='Об игре';
};
})();
