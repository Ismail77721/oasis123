/* Approved cartoon artwork and a culled, event-driven isometric map. */
(function(){'use strict';const M=MainScene.prototype,C=OASIS_CONFIG,L=OasisMapLayout,A=OasisCartoon,$=id=>document.getElementById(id);
const edit=s=>['canal','building','move','remove'].includes(s.tool);
const file=key=>A[key]?.file||A['products-8'].file;
window.OasisArtFile=file;
LoadingScene.prototype.preload=function(){for(const [key,a] of Object.entries(A))this.load.image('cartoon-'+key,a.file+'?v=3.3.0');this.load.on('loaderror',f=>(window.OasisLoadErrors||=[]).push(f.key));};
M.preload=function(){};
M.mapGeometry=function(w,h){const top=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-top'))||0)+48;return{top,height:Math.max(120,h-top-20),tw:28*(this.mapZoom||1)};};
M.drawCultivatedSoil=function(){};
M.calculateWater=function(){const sig=this.s.worldSize+':'+C.wellIndex+':'+(this.s.mapRevision||0)+':'+(this.s.wellLevel||1)+':'+OasisProgression.irrigationRadius(this.s);if(this.waterSignature===sig)return;this.waterSignature=sig;
 const n=this.s.worldSize,q=OasisWell.area(this.s),seen=new Set(q);this.connected=new Set();
 for(let k=0;k<q.length;k++)for(const j of this.neighbors(q[k]))if(!seen.has(j)&&this.s.tiles[j]?.canal){seen.add(j);this.connected.add(j);q.push(j);}
 const wet=new Uint8Array(n*n),radius=OasisIrrigation.distance(this.s);
 for(const i of q){const r=Math.floor(i/n),c=i%n;for(let dr=-radius;dr<=radius;dr++)for(let dc=-(radius-Math.abs(dr));dc<=radius-Math.abs(dr);dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&cc>=0&&rr<n&&cc<n)wet[rr*n+cc]=1;}}
 this.wetCells=wet;};
M.renderGround=function(w,h){const g=this.g;g.fillStyle(0xf1c878);g.fillRect(0,0,w,h);const q=this.mapGeometry(w,h),step=q.tw*3,ox=w/2+(this.panX||0),oy=q.top+(q.height-C.worldSize*q.tw/2)/2+(this.panY||0);
 // Sand marks are world-anchored and scale with the camera; no screen-fixed texture.
 const startX=Math.floor(-ox/step)-1,endX=Math.ceil((w-ox)/step)+1,startY=Math.floor(-oy/step)-1,endY=Math.ceil((h-oy)/step)+1;
 for(let r=startY;r<=endY;r++)for(let c=startX;c<=endX;c++){const hash=Math.abs((r*73856093)^(c*19349663)),x=ox+c*step+(hash%17)/17*step,y=oy+r*step+(hash%23)/23*step;g.lineStyle(Math.max(.7,q.tw*.025),hash%2?0xe9ba68:0xf7d78f,.7);g.lineBetween(x,y,x+q.tw*.3,y-q.tw*.04);}
 return true;};
M.placeCartoon=function(sprite,key,x,y,tw,th,rows,cols){const a=A[key],h=a.height/a.width;const footprintW=(rows+cols)*tw/2,footprintH=(rows+cols)*th/2;
 // A rectangle inside the footprint diamond: even tall palms cannot cover another plot.
 const width=Math.min(rows*tw/(2*a.rm),cols*tw/(2*a.cm))*.92;const height=width*h;
 const cx=x+(cols-rows)*tw/4,cy=y+(rows+cols-2)*th/4;
 sprite.setTexture('cartoon-'+key).setOrigin(.5).setPosition(cx,cy).setDisplaySize(width,height).setDepth(100+cy).setVisible(true).setAlpha(edit(this.s)?.3:1);return sprite;
};
M.renderArtwork=function(i,t,x,y,tw,th){let spr=this.art[i];if(!t.crop&&!t.building){spr?.setVisible(false);return true;}let key,rows,cols;
 if(t.building){[rows,cols]=L.buildingSize(t.building,t.buildingRotated);key=t.building+'-'+(Math.min(3,t.buildingLevel||1)-1);}else{rows=cols=2;const pct=(Date.now()-t.plantedAt)/(C.crops[t.crop].growSeconds*1000);let stage=pct>=1?4:t.perennialEstablished?5:pct<.08?0:pct<.3?1:pct<.65?2:3;key=t.crop+'-'+stage;}
 if(!spr)spr=this.art[i]=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(spr,key,x,y,tw,th,rows,cols);spr.setFlipX(!!t.buildingRotated);return true;};
M.drawHouseImage=function(){const h=this.s.house,cell=this.cellPosition(h.row*this.s.worldSize+h.col),key='home-'+(Math.min(5,h.level||1)-1);if(!this.homeSprite)this.homeSprite=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(this.homeSprite,key,cell.x,cell.y,cell.w,cell.h,OasisFamilyLand.houseSide(h),OasisFamilyLand.houseSide(h));};
M.renderWellSprite=function(x,y,tw,th){const key='well-'+(Math.min(3,this.s.wellLevel||1)-1);if(!this.wellSprite)this.wellSprite=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(this.wellSprite,key,x,y,tw,th,3,3);return true;};
M.cellPosition=function(i){const n=this.s.worldSize,q=this.mapGeometry(this.scale.width,this.scale.height),r=Math.floor(i/n),c=i%n;return{i,x:this.scale.width/2+(this.panX||0)+(c-r)*q.tw/2,y:q.top+(q.height-n*q.tw/2)/2+(this.panY||0)+(c+r)*q.tw/4,w:q.tw,h:q.tw/2};};
M.visibleBuildingAt=function(x,y){const c=this.mapCellAt(x,y);const o=c&&L.objectAt(this.s,c.i);return o&&['home','well','building'].includes(o.kind)?o:null;};
const oldCanal=M.drawCanal;
M.drawCanal=function(g,r,c,i,x,y,tw,th){if(i===C.wellIndex)return;const arms=L.arms(this.s,i),wet=this.connected.has(i);for(const a of arms){const X=x+a.x*tw/4,Y=y+a.y*th/4;g.lineStyle(tw*.37,0x603817);g.lineBetween(x,y,X,Y);g.lineStyle(tw*.30,0xd97938);g.lineBetween(x,y,X,Y);g.lineStyle(tw*.18,wet?0x46b5ce:0xb98c51);g.lineBetween(x,y,X,Y);if(wet){g.lineStyle(tw*.035,0xb6edef);g.lineBetween(x,y-th*.025,X,Y-th*.025);}}};
M.render=function(){if(!this.s||!this.g)return;const now=Date.now(),s=this.s;OasisFarmSystems.ensure(s);OasisFamilyLand.ensureFamily(s,now);this.calculateWater();
 const paused=this.updateEditClock(now);if(!paused){OasisFarmSystems.updateIrrigation(s,i=>this.irrigated(i),now);const jobs=OasisFarmSystems.tick(s,i=>this.irrigated(i),now);if(jobs.completed.length&&now-(this.lastWorkNotice||0)>8000){this.lastWorkNotice=now;this.notify('Работник выполнил заданий: '+jobs.completed.length);}}
 if(now-(this.lastPeriodicSave||0)>10000){this.lastPeriodicSave=now;this.save();}
 const g=this.g,ui=this.overlay,w=this.scale.width,h=this.scale.height;g.clear();ui.clear();this.renderGround(w,h);
 for(const spr of Object.values(this.art))spr?.setVisible(false);
 this.cells=[];const n=s.worldSize,geo=this.mapGeometry(w,h),tw=geo.tw,th=tw/2,ox=w/2+(this.panX||0),oy=geo.top+(geo.height-n*th)/2+(this.panY||0);
 this.drawFence(g,ox,oy,tw,th,n);this.drawCanalNetwork?.();
 const rs=[],cs=[];for(const X of [-tw*10,w+tw*10])for(const Y of [-tw*10,h+tw*10]){rs.push((Y-oy)/th-(X-ox)/tw);cs.push((Y-oy)/th+(X-ox)/tw);}
 const r0=Math.max(0,Math.floor(Math.min(...rs))),r1=Math.min(n-1,Math.ceil(Math.max(...rs))),c0=Math.max(0,Math.floor(Math.min(...cs))),c1=Math.min(n-1,Math.ceil(Math.max(...cs)));
 for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*n+c,t=s.tiles[i],cell=this.cellPosition(i),{x,y}=cell;if(x< -tw*8||x>w+tw*8||y< -tw*8||y>h+tw*8)continue;this.cells.push(cell);
  if(edit(s)||this.plantMode){g.lineStyle(.7,0x946037,.25);g.strokePoints([{x,y:y-th/2},{x:x+tw/2,y},{x,y:y+th/2},{x:x-tw/2,y}],true);}
  
  this.renderArtwork(i,t,x,y,tw,th);
  if(!edit(s)&&((t.crop&&OasisTimeSystem.isReady(t))||(t.productionAt>0&&t.productionAt<=now))){const spr=this.art[i],px=spr.x,py=spr.y-spr.displayHeight-5;ui.fillStyle(0xfff3cc);ui.fillCircle(px,py,5);ui.lineStyle(1.5,0x348745);ui.strokeCircle(px,py,5);ui.lineBetween(px-2,py,px,py+2);ui.lineBetween(px,py+2,px+3,py-2);}
 }
 this.drawHouseImage();const well=this.cellPosition(C.wellIndex);this.wellCell=well;this.well=well;this.renderWellSprite(well.x,well.y,tw,th);
 this.drawEditPreview();this.drawPlantPreview?.();this.drawWorkerIndicator?.();
 document.body.classList.toggle('farm-editing',edit(s));$('stop-build').hidden=!edit(s);$('mode-chip').hidden=true;$('quest-banner').hidden=true;
 OasisUI.currency($('resources'),s.coins);const seeds=Object.values(s.seedBank).reduce((a,b)=>a+b,0),stock=Object.values(s.inventory).reduce((a,b)=>a+b,0);$('family-hud').textContent='Ур. '+this.getLevel()+' · Семена '+seeds+' · Амбар '+stock;$('phase').textContent='День '+(1+Math.floor((now-s.createdAt)/7200000))+' · v3.3.0';
 if(!$('farm').hidden)this.updateFarmStatus?.();if(this.guideActive)this.positionGuide();
 const level=this.getLevel();if(this.levelProfile!==s){this.levelProfile=s;this.lastAnnouncedLevel=level;}if(level>this.lastAnnouncedLevel){const names=[...Object.values(C.crops),...Object.values(OASIS_BUILDINGS)].filter(c=>c.unlock>this.lastAnnouncedLevel&&c.unlock<=level).map(c=>c.title);this.notify('Уровень '+level+(names.length?' · Открыто: '+names.join(', '):''));this.lastAnnouncedLevel=level;}
};
M.installUnifiedIcons=function(){
 const products={wool:0,camelMilk:1,honey:2,cuminOil:3,oliveOil:4,flour:5,cloth:6};
 const map={'🪙':'products-7','🧺':'products-8','📦':'home-5','🌴':'dates-4','🌱':'watermelon-1','🌳':'sidr-4','🍉':'watermelon-4','🍈':'melon-4','☘':'clover-4','🍀':'clover-4','🌾':'wheat-4','🌼':'flowers-4','🌸':'flowers-4','🫒':'olive-4','🧶':'products-0','🥛':'products-1','🍯':'products-2','🧵':'products-6','🏺':'products-3','🏠':'home-0','🏡':'home-0','🛠':'products-8','🔊':'sound','🔇':'sound','⚙':'settings'};
 let queued=false;const run=()=>{queued=false;observer.disconnect();const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
 for(const node of nodes){const parent=node.parentElement;if(!parent||['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(parent.tagName))continue;const value=node.nodeValue;if(!/\p{Extended_Pictographic}/u.test(value))continue;const rx=/\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*/gu;if(parent.closest('option')){node.nodeValue=value.replace(rx,'');continue;}const frag=document.createDocumentFragment();let pos=0;for(const m of value.matchAll(rx)){frag.append(value.slice(pos,m.index));const tail=value.slice(m.index+m[0].length),crop=Object.entries(C.crops).find(([id,c])=>tail.trimStart().startsWith(c.title)),prod=Object.entries(products).find(([id])=>tail.includes(OasisFamilyLand.labels(id))),key=m[0].includes('🪙')?'products-7':crop?crop[0]+'-4':prod?'products-'+prod[1]:map[m[0].replace(/[\uFE0F\u200D]/g,'')];if(key){const img=document.createElement('img');img.className='oasis-ui-icon';img.alt='';img.src=['sound','settings'].includes(key)?'assets/art/v2.2/'+key+'.svg':file(key);frag.append(img);}pos=m.index+m[0].length;}frag.append(value.slice(pos));node.replaceWith(frag);}
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});};const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(run);}});run();
};
})();
