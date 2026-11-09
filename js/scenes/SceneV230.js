/* v2.2: grid-consistent world, bounded UI, texture surface and native gestures. */
(function(){'use strict';
const M=MainScene.prototype,C=OASIS_CONFIG,L=OasisMapLayout;
const $=id=>document.getElementById(id),edit=s=>['canal','building','move','remove'].includes(s.tool);
M.appendZakat=function(){};M.updateZakatReminder=function(){};
M.notify=function(message){
 if(!this.s)return;const text=String(message).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').trim();
 const log=this.s.activityLog ||= [],last=log[log.length-1];
 if(!last||last.text!==text||Date.now()-last.at>10000){log.push({at:Date.now(),text});if(log.length>120)log.shift();}
 const el=$('feedback');el.textContent=text;el.classList.add('toast-open');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('toast-open'),1800);
};
M.openActivityLog=function(){this.closeAllPanels();const list=$('activity-items');list.replaceChildren();for(const item of [...(this.s.activityLog||[])].reverse()){const row=document.createElement('p');row.textContent=new Date(item.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+' · '+item.text;list.append(row);}if(!list.childElementCount)list.textContent='Здесь появятся последние действия в хозяйстве.';$('activity-panel').hidden=false;};
M.mapGeometry=function(w,h){const landscape=w>h&&h<650,top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--telegram-top'))||0;const usable=Math.max(120,h-top-(landscape?84:180)),n=C.worldSize;return {top:top+72,height:usable,tw:Math.max(.6,Math.min((w-(landscape?150:32))/(n+1),usable/(n*.5+1)))*(this.mapZoom||1)};};
M.clampPan=function(){const w=this.scale.width,h=this.scale.height,{tw}=this.mapGeometry(w,h),n=C.worldSize;const mx=tw*n/2+w*.65,my=tw*n/4+h*.65;this.panX=Math.max(-mx,Math.min(mx,this.panX||0));this.panY=Math.max(-my,Math.min(my,this.panY||0));};
M.changeZoom=function(factor,x=this.scale.width/2,y=this.scale.height/2){this.manualMapZoom=true;const old=this.mapZoom||1,next=Math.max(.65,Math.min(12,old*factor)),a=this.mapGeometry(this.scale.width,this.scale.height);const ox=this.scale.width/2+(this.panX||0),oy=a.top+(a.height-C.worldSize*a.tw*.5)/2+(this.panY||0);const ux=(x-ox)/a.tw,uy=(y-oy)/a.tw;this.mapZoom=next;const b=this.mapGeometry(this.scale.width,this.scale.height);this.panX=x-ux*b.tw-this.scale.width/2;this.panY=y-uy*b.tw-b.top-(b.height-C.worldSize*b.tw*.5)/2;this.clampPan();};
M.mapCellAt=function(x,y){const n=C.worldSize,{top,height,tw}=this.mapGeometry(this.scale.width,this.scale.height),th=tw/2,ox=this.scale.width/2+(this.panX||0),oy=top+(height-n*th)/2+(this.panY||0);const r=Math.round((y-oy)/th-(x-ox)/tw),c=Math.round((y-oy)/th+(x-ox)/tw);if(r<0||c<0||r>=n||c>=n)return null;return {i:r*n+c,x:ox+(c-r)*tw/2,y:oy+(r+c)*th/2,w:tw,h:th};};
M.hitCell=function(x,y){const c=this.mapCellAt(x,y);if(!c)return null;const anchor=L.cropAt(this.s,c.i);return anchor===null?c:{...c,i:anchor};};
M.calculateWater=function(){
 const now=performance.now(),signature=this.s.worldSize+':'+C.wellIndex+':'+(this.s.wellLevel||1)+':'+OasisProgression.irrigationRadius(this.s)+':'+this.s.tiles.flatMap((t,i)=>t.canal?[i]:[]).join(',');if(this.waterSignature===signature)return;this.waterSignature=signature;
 this.waterCalcAt=now;this.waterTiles=this.s.tiles;this.connected=new Set();const n=C.worldSize,q=[C.wellIndex],seen=new Set(q);
 for(let k=0;k<q.length;k++)for(const j of this.neighbors(q[k]))if(!seen.has(j)&&this.s.tiles[j]?.canal){seen.add(j);this.connected.add(j);q.push(j);}
 const radius=OasisProgression.irrigationRadius(this.s)*(this.s.geometryVersion===2?4:1),wet=new Uint8Array(n*n);
 for(const i of q){const row=Math.floor(i/n),col=i%n;for(let dr=-radius;dr<=radius;dr++)for(let dc=-(radius-Math.abs(dr));dc<=radius-Math.abs(dr);dc++){const r=row+dr,c=col+dc;if(r>=0&&c>=0&&r<n&&c<n)wet[r*n+c]=1;}}
 const wellRadius=(this.s.wellLevel||1)*(this.s.geometryVersion===2?4:1),wr=Math.floor(C.wellIndex/n),wc=C.wellIndex%n;for(let dr=-wellRadius;dr<=wellRadius;dr++)for(let dc=-wellRadius;dc<=wellRadius;dc++)if(Math.abs(dr)+Math.abs(dc)<=wellRadius&&wr+dr>=0&&wc+dc>=0&&wr+dr<n&&wc+dc<n)wet[(wr+dr)*n+wc+dc]=1;this.wetCells=wet;
};
M.irrigated=function(i){return Boolean(this.wetCells?.[i]);};
M.renderGround=function(w,h){if(!this.textures.exists('world-sand'))return false;if(!this.sandSurface)this.sandSurface=this.add.tileSprite(0,0,w,h,'world-sand').setOrigin(0).setDepth(-100);const tw=this.mapGeometry(w,h).tw;this.sandSurface.setSize(w,h);this.sandSurface.tileScaleX=this.sandSurface.tileScaleY=Math.max(.15,tw/50);this.sandSurface.tilePositionX=-(this.panX||0)/this.sandSurface.tileScaleX;this.sandSurface.tilePositionY=-(this.panY||0)/this.sandSurface.tileScaleY;return true;};
M.drawSandDecoration=function(){}; // Tile-shaped decoration patches removed; continuous sand supplies detail.
// Exact posts and boards share the same projected world endpoints. No overlapping sprite margins.
M.drawFence=function(g,ox,oy,tw,th,n){
 for(const s of Object.values(this.fenceArt||{}))s.setVisible(false);
 const v=[{x:ox,y:oy-th/2},{x:ox+n*tw/2,y:oy+(n-1)*th/2},{x:ox,y:oy+(n-.5)*th},{x:ox-n*tw/2,y:oy+(n-1)*th/2}];
 const drawPost=(x,y)=>{const h=tw*.45,w=Math.max(2,tw*.13);g.fillStyle(0x83502a);g.fillRect(x-w/2,y-h,w,h);g.fillStyle(0xd3a56b);g.fillRect(x-w/2,y-h,w*.35,h);g.fillStyle(0xe9c389);g.fillEllipse(x,y-h,w,w*.5);g.lineStyle(Math.max(.6,tw*.025),0x5d3d26,.7);g.lineBetween(x+w*.2,y-h*.9,x+w*.2,y-h*.15);};
 for(let side=0;side<4;side++){const a=v[side],b=v[(side+1)%4],steps=Math.ceil(n/2);for(let k=0;k<steps;k++){const t=k/steps,u=(k+1)/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,X=a.x+(b.x-a.x)*u,Y=a.y+(b.y-a.y)*u;if(Math.max(x,X)<-50||Math.min(x,X)>this.scale.width+50||Math.max(y,Y)<-50||Math.min(y,Y)>this.scale.height+50)continue;
 const gate=side===1&&k===Math.floor(steps/2);
 if(gate){for(let j=0;j<8;j++){const f=(j+.5)/8,px=x+(X-x)*f,py=y+(Y-y)*f;g.lineStyle(Math.max(2,Math.hypot(X-x,Y-y)/9),j%2?0xae753c:0xbd884b,1);g.lineBetween(px,py-th*.03,px,py-tw*.42);}g.lineStyle(Math.max(1,tw*.045),0x6e4828);g.lineBetween(x,y-tw*.35,X,Y-tw*.12);}
 else for(const h of [.14,.32]){g.lineStyle(Math.max(2,tw*.09),0x80502d,1);g.lineBetween(x,y-tw*h,X,Y-tw*h);g.lineStyle(Math.max(1,tw*.035),0xd6ab73,1);g.lineBetween(x,y-tw*h-tw*.035,X,Y-tw*h-tw*.035);}
 drawPost(x,y);if(k===steps-1)drawPost(X,Y);
 }}
};
// Connected masonry irrigation: paired edges, block joints and water follow the same grid vectors.
M.drawCanal=function(g,r,c,i,x,y,tw,th){const arms=L.arms(this.s,i),wet=i===C.wellIndex||this.connected.has(i);for(const a of arms){const X=x+a.x*tw/4,Y=y+a.y*th/4,dx=X-x,dy=Y-y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;const half=tw*.10;
 g.lineStyle(tw*.28,0x97673c);g.lineBetween(x,y,X,Y);g.lineStyle(tw*.20,wet?0x3e9fae:0xab895b);g.lineBetween(x,y,X,Y);
 for(const sign of [-1,1]){g.lineStyle(Math.max(1,tw*.055),0xe1b77f);g.lineBetween(x+nx*half*sign,y+ny*half*sign,X+nx*half*sign,Y+ny*half*sign);for(const f of [.25,.6,.92]){const px=x+dx*f+nx*half*sign,py=y+dy*f+ny*half*sign;g.lineStyle(Math.max(.5,tw*.012),0x9e7047);g.lineBetween(px-nx*tw*.025,py-ny*tw*.025,px+nx*tw*.025,py+ny*tw*.025);}}
 if(wet){g.lineStyle(Math.max(.7,tw*.02),0xa3e4db,.8);g.lineBetween(x+dx*.15,y+dy*.15,X-dx*.12,Y-dy*.12);}}
};
M.renderArtwork=function(i,t,x,y,tw,th){
 let s=this.art[i];if(!t.crop&&!t.building){s?.setVisible(false);return true;}
 if(t.crop&&tw<10){s?.setVisible(false);this.g.fillStyle(OasisTimeSystem.isReady(t)?0x578742:0x8b9a51,.85);this.g.fillEllipse(x,y+th*.5,tw*1.4,th*1.2);return true;}
 let key,rows,cols,origin=.9;
 if(t.building){[rows,cols]=L.buildingSize(t.building,t.buildingRotated);key='art-building-'+t.building+'-l'+Math.min(3,t.buildingLevel||1);origin=this.cache.json.get('approved-art-meta')?.[t.building+'-l'+Math.min(3,t.buildingLevel||1)]?.anchor?.[1]||.96;}
 else {rows=cols=t.cropArea?2:1;const pct=Math.max(0,(Date.now()-t.plantedAt)/(C.crops[t.crop].growSeconds*1000));const ready=OasisTimeSystem.isReady(t),tree=['dates','olive','fig','pomegranate','sidr'].includes(t.crop);
 if(!t.perennialEstablished&&pct<.12){s?.setVisible(false);return true;}
 key=!t.perennialEstablished&&pct<.6?('stage-'+(t.crop==='dates'?'palm-young':t.crop==='olive'?'olive-young':tree?'tree-young':'sprout')):'art-'+t.crop+'-'+(ready||t.perennialEstablished?'ripe':'grow');origin=.94;
 }
 if(!this.textures.exists(key))return false;
 if(!s)s=this.art[i]=this.add.image(0,0,key);s.setTexture(key);const src=this.textures.get(key).getSourceImage();
 const width=tw*(rows+cols)/2*.81;
 s.setOrigin(.5,origin).setDisplaySize(width,width*src.height/src.width).setPosition(x+(cols-rows)*tw/4,y+(rows+cols-1)*th/2-th*.22).setFlipX(Boolean(t.building&&t.buildingRotated)).setDepth(110+Math.round(y+(rows+cols)*th/2)).setVisible(true);
 return true;
};
M.drawCultivatedSoil=function(g,x,y,tw,th){const pts=[{x,y:y-th*.5},{x:x+tw,y:y+th*.5},{x,y:y+th*1.5},{x:x-tw,y:y+th*.5}];g.fillStyle(0xa27b46,.9);g.fillPoints(pts,true);g.lineStyle(Math.max(1,tw*.035),0xc59b61,1);for(let j=1;j<6;j++){const f=j/6;g.lineBetween(x-tw*f,y-th*.5+th*f,x+tw*(1-f),y+th*.5+th*f);}};
M.drawHouseImage=function(){const h=this.s.house,n=C.worldSize,geo=this.mapGeometry(this.scale.width,this.scale.height),tw=geo.tw,th=tw/2,side=OasisFamilyLand.houseSide(h),x=this.scale.width/2+(this.panX||0)+(h.col-h.row)*tw/2,y=geo.top+(geo.height-n*th)/2+(this.panY||0)+(h.col+h.row)*th/2;const key='art-home-'+h.level;const src=this.textures.get(key).getSourceImage();if(!this.homeSprite)this.homeSprite=this.add.image(0,0,key);const width=tw*side*.78;this.homeSprite.setTexture(key).setOrigin(.5,.96).setDisplaySize(width,width*src.height/src.width).setPosition(x,y+(side-.5)*th).setDepth(110+Math.round(y+side*th)).setFlipX(!!h.flipped);};
const preload=M.preload;M.preload=function(){preload?.call(this);for(const [key,file] of Object.entries({'world-sand':'sand','stage-sprout':'sprout','stage-palm-young':'palm-young','stage-olive-young':'olive-young','stage-tree-young':'tree-young'}))this.load.image(key,'assets/art/v2.2/'+file+'.webp?v=2.2.0');};
const closePanels=M.closeAllPanels;M.closeAllPanels=function(){closePanels.call(this);if($('activity-panel'))$('activity-panel').hidden=true;};const back=M.goBack;M.goBack=function(){if($('activity-panel')&&!$('activity-panel').hidden){$('activity-panel').hidden=true;return;}return back.call(this);};
const create=M.create,render=M.render;
M.create=function(){create.call(this);
 const b=document.createElement('button');b.id='journal-toggle';b.textContent='Журнал';b.onclick=()=>this.openActivityLog();document.body.append(b);
 const panel=document.createElement('section');panel.id='activity-panel';panel.className='ui-modal';panel.hidden=true;panel.innerHTML='<div class="activity-card"><button id="activity-close">Назад</button><h2>Журнал хозяйства</h2><div id="activity-items"></div></div>';document.body.append(panel);$('activity-close').onclick=()=>{panel.hidden=true;this.save();};
 const canvas=this.game.canvas;
 canvas.style.touchAction='none';
 const pointers=new Map();let pinch=null,ignoreUntil=0;
 const coords=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*this.scale.width/r.width,y:(e.clientY-r.top)*this.scale.height/r.height};};
 canvas.addEventListener('wheel',e=>{if(this.marketOpen||document.querySelector('.ui-modal:not([hidden])'))return;e.preventDefault();const q=coords(e);this.changeZoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.003),q.x,q.y);this.queueMapRender();},{passive:false});
 canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,coords(e));if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2};this.nativePinch=true;this.clearLongPress();this.swipeCandidate=null;e.stopImmediatePropagation();}},true);
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,coords(e));if(pointers.size!==2||!pinch)return;e.preventDefault();e.stopImmediatePropagation();const[a,b]=[...pointers.values()],d=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),x=(a.x+b.x)/2,y=(a.y+b.y)/2;this.changeZoom(d/Math.max(1,pinch.d),x,y);this.panX+=x-pinch.x;this.panY+=y-pinch.y;pinch={d,x,y};this.queueMapRender();},{passive:false,capture:true});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,e=>{pointers.delete(e.pointerId);if(this.nativePinch){this.dragPointer=null;this.pinchStart=null;this.swipeCandidate=null;this.swipeActive=false;ignoreUntil=Date.now()+250;if(!pointers.size){this.nativePinch=false;pinch=null;}}},true);
 const tap=this.onMapTap;this.onMapTap=p=>{if(this.nativePinch||Date.now()<ignoreUntil)return;return tap.call(this,p);};
 this.installUnifiedIcons();
};
M.queueMapRender=function(){if(this.renderQueued)return;this.renderQueued=true;requestAnimationFrame(()=>{this.renderQueued=false;this.render();});};
M.render=function(){render.call(this);if(!this.s)return;$('phase').textContent='День '+(1+Math.floor(Math.max(0,Date.now()-(this.s.createdAt||this.s.startedAt||Date.now()))/7200000))+' · v2.2.0';$('mode-chip').hidden=true;$('quest-banner').hidden=true;const marks=this.readyMarks;if(marks&&this.mapGeometry(this.scale.width,this.scale.height).tw<12)marks.clear();};
const productIcon=M.productIcon;M.productIcon=function(id){return productIcon?.call(this,id)||'';};
M.installUnifiedIcons=function(){
 const map={'🪙':'assets/art/v2.2/coin.webp','📦':'assets/sprites/icon-barn.png','🧺':'assets/sprites/building-storage.png','🌱':'assets/sprites/icon-plant.png','🌴':'assets/art/dates-ripe.png','🌳':'assets/art/sidr-ripe.png','🍉':'assets/art/watermelon-ripe.png','🍈':'assets/art/melon-ripe.png','🍀':'assets/art/clover-ripe.png','🌸':'assets/art/flowers-ripe.png','🌾':'assets/art/wheat-ripe.png','🫒':'assets/art/olive-ripe.png','⚙':'assets/art/v2.2/settings.svg','🏠':'assets/sprites/icon-home.png','🧶':'assets/art/v2.2/wool.svg','🧵':'assets/art/v2.2/cloth.svg','🍯':'assets/art/v2.2/honey.svg','🥛':'assets/art/v2.2/camelMilk.svg','🏺':'assets/art/v2.2/cuminOil.svg','🔊':'assets/art/v2.2/sound.svg','🔇':'assets/art/v2.2/sound.svg'};
 const rx=/\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*/gu;let pending=false;
 const replace=()=>{pending=false;observer.disconnect();const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){if(!node.parentElement||['SCRIPT','STYLE','TEXTAREA'].includes(node.parentElement.tagName))continue;const value=node.nodeValue;if(!/\p{Extended_Pictographic}/u.test(value))continue;if(node.parentElement.closest('option')){node.nodeValue=value.replace(rx,'');continue;}const frag=document.createDocumentFragment();let start=0;for(const match of value.matchAll(rx)){frag.append(value.slice(start,match.index));const img=document.createElement('img');img.className='oasis-ui-icon';img.alt='';const product=value.includes('Оливковое масло')?'oliveOil':value.includes('Масло тмина')?'cuminOil':value.includes('Мука')?'flour':null;img.src=product?'assets/art/v2.2/'+product+'.svg':map[match[0]]||map[match[0].replace(/[\uFE0F\u200D]/g,'')]||'assets/sprites/icon-orders.png';if(img.src.endsWith('icon-tools.png'))img.src='assets/sprites/icon-upgrade.png';frag.append(img);start=match.index+match[0].length;}frag.append(value.slice(start));node.replaceWith(frag);}observer.observe(document.body,{childList:true,subtree:true,characterData:true});};
 const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(replace);}});replace();
};
})();
