/* ОАЗИС v2.0 ART PREVIEW: independent transparent sprites integrated into the actual Phaser map.
   No save-key change. Rendering rules are deliberately separate from farming/economy logic. */
(function(){'use strict';
 const M=MainScene.prototype,C=window.OASIS_CONFIG;
 C.version='1.9.1';
 const oldFence=M.drawFence,oldSand=M.drawSandDecoration,oldRender=M.render;
 const oldWell=M.renderWellSprite;
 const available=(scene,key)=>Boolean(scene.add?.image&&scene.textures?.exists?.(key));
 const night=()=>OasisTimeSystem.getPhase()==='night';
 // No second soil ellipse: crop sprites already contain their square diamond-shaped ground bed.
 M.drawCultivatedSoil=function(){};
 // Remove the geometric oil-painted stand-ins. Every crop and installed building gets a true sprite.
 M.renderArtwork=function(i,t,x,y,tw,th){
  let key=null,scale=1;
  const tree=['dates','fig','pomegranate','olive','sidr'];
  let baseline=y+th*.16;
  if(t.building){
   key='art-building-'+t.building;
   const [rows,cols]=t.buildingArea&&window.OasisMapLayout?OasisMapLayout.buildingSize(t.building,t.buildingRotated):[1,1];
   x+=(cols-rows)*tw/4;
   baseline=y+(rows+cols-1)*th/2-th*.12;
   scale=(rows+cols)*.46;
   if(t.building==='oilpress')scale*=1.45;
   if(t.building==='olivepress')scale*=1.25;
  }
  else if(t.crop){key='art-'+t.crop+'-'+(OasisTimeSystem.isReady(t)||t.perennialEstablished?'ripe':'grow');scale=tree.includes(t.crop)?1.66:1.05;}
  let sprite=this.art?.[i];
  if(!key){sprite?.setVisible?.(false);return true;}
  if(!available(this,key)){sprite?.setVisible?.(false);return false;}
  if(!sprite){sprite=this.add.image(0,0,key).setOrigin(.5,.9);this.art[i]=sprite;}
  if(sprite.texture?.key!==key)sprite.setTexture(key);
  const asset=this.textures.get(key)?.getSourceImage?.();
  const ratio=asset?.width?asset.height/asset.width:1;
  const sw=tw*scale;
  sprite.setDisplaySize(sw,sw*ratio);
  const origin=t.building==='oilpress'?.95:t.building==='olivepress'?.94:.9;
  sprite.setOrigin(.5,origin);
  sprite.setFlipX?.(Boolean(t.building&&t.buildingRotated));
  sprite.setPosition(x,baseline);
  sprite.setDepth(110+Math.round(baseline));sprite.setVisible(true);
  if(night())sprite.setTint(0xa6b5c8);else sprite.clearTint();
  return true;
 };
 // Well from the approved sheet is a real, isolated sprite; one well object can be upgraded later.
 M.renderWellSprite=function(x,y,tw,th){
  const key='art-well';if(!available(this,key))return oldWell.call(this,x,y,tw,th);
  if(!this.wellSprite)this.wellSprite=this.add.image(0,0,key).setOrigin(.5,.88);
  const asset=this.textures.get(key)?.getSourceImage?.();const ratio=asset?.width?asset.height/asset.width:1;
  this.wellSprite.setTexture(key).setDisplaySize(tw*1.70,tw*1.70*ratio);
  this.wellSprite.setPosition(x,y+th*.18).setDepth(115+Math.round(y));
  if(night())this.wellSprite.setTint(0xa6b5c8);else this.wellSprite.clearTint();return true;
 };
 // Dynamic, reusable Phaser display-objects (graphics.drawCanvas outlines are intentionally gone).
 function showSprite(scene,cache,slot,key,x,y,w,h,depth,flipX,flipY){
  if(!available(scene,key))return false;
  let s=cache[slot];if(!s){s=scene.add.image(x,y,key);cache[slot]=s;}
  if(s.texture?.key!==key)s.setTexture(key);
  s.setPosition(x,y).setDisplaySize(w,h).setDepth(depth).setVisible(true);
  s.setFlipX?.(!!flipX);s.setFlipY?.(!!flipY);
  if(night())s.setTint?.(0xa5b3c5);else s.clearTint?.();
  return true;
 }
 M.drawSandDecoration=function(g,x,y,tw,th,i){
  if(i%23!==4&&i%37!==9)return;
  const id=i%23===4?'grass':'rocks', key='sprite-terrain-'+id;
  this.decorArt=this.decorArt||{};
  if(!showSprite(this,this.decorArt,i,key,x,y+th*.1,tw*.69,tw*.69*(id==='grass'?.62:.50),50+Math.round(y))){oldSand.call(this,g,x,y,tw,th,i);}
 };
 // Fences are real modular wooden pieces on the perimeter; no hand-drawn stick segments.
 M.drawFence=function(g,ox,oy,tw,th,n){
  const key='sprite-terrain-fence-straight';
  if(!available(this,key))return oldFence.call(this,g,ox,oy,tw,th,n);
  this.fenceArt=this.fenceArt||{};
  const corners=[{x:ox,y:oy-th/2},{x:ox+n*tw/2,y:oy+(n-1)*th/2},{x:ox,y:oy+(n-1)*th+th/2},{x:ox-n*tw/2,y:oy+(n-1)*th/2}];
  const slots=new Set();
  for(let side=0;side<4;side++){
   const a=corners[side],b=corners[(side+1)%4];
   for(let j=0;j<n;j++){
    const isGate=side===1&&j===Math.floor(n/2);
    const id=side+'-'+j;slots.add(id);
    const u=(j+.5)/n,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
    const fenceKey=isGate?'sprite-terrain-gate':key;
    showSprite(this,this.fenceArt,id,fenceKey,x,y-th*.10,
     isGate?tw*1.25:tw*.76,isGate?tw*.71:tw*.37,
     75+Math.round(y),side===0||side===2,false);
   }
  }
  for(const [id,s] of Object.entries(this.fenceArt))if(!slots.has(id))s.setVisible(false);
 };
 M.render=function(){
  for(const sprite of Object.values(this.decorArt||{}))sprite.setVisible(false);
  oldRender.call(this);
  if(!this.s)return;
  const seed=Object.values(this.s.seedBank||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const items=Object.values(this.s.inventory||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const hud=document.getElementById('family-hud');
  if(hud)hud.textContent='Уровень '+this.getLevel()+' · Семена '+seed+' · Амбар '+items;
  const phase=document.getElementById('phase');
  if(phase)phase.textContent=(night()?'Ночь':'День')+' · v'+C.version;
 };
})();
