(function(){'use strict';const M=MainScene.prototype,MAX=Math.max(...OasisFamilyLand.SIDES),edge=MAX/2+12,objects=[];
const add=(r,c,key,rows=2,cols=2)=>objects.push({r,c,key,rows,cols});
for(const [r,c,kind] of [[-edge-9,-30,0],[-35,edge+8,1],[edge+9,12,2],[22,-edge-14,3]]){add(r,c,kind===2?'loom-0':'home-0',kind===2?5:7,kind===2?5:7);if(kind===0){for(let j=0;j<3;j++)add(r-3,c+8+j*4,'dates-4');add(r+6,c+9,'well-0',4,4);}if(kind===1){for(let j=0;j<3;j++)add(r+9,c+j*3,['watermelon-2','clover-3','wheat-4'][j]);add(r-2,c+9,'dates-4');}if(kind===2){add(r+7,c+3,'products-6');add(r+7,c+6,'products-5');}if(kind===3){objects.push({r:r+9,c:c+1,kind:'foundation'});add(r-2,c+9,'dates-4');}}
for(let k=0;k<32;k++){const side=k%4,u=((k*37)%200)-100,d=edge+10+(k%3)*6,r=side===0?-d:side===1?d:u,c=side===2?-d:side===3?d:u;if(k%5===0)add(r,c,'dates-4');else objects.push({r,c,kind:k%3?'rock':'shrub'});}
objects.push({r:-edge-23,c:-edge+24,kind:'cliff'},{r:-edge+18,c:edge+22,kind:'cliff'});
objects.push({r:-edge-35,c:25,kind:'dune'},{r:edge+32,c:-45,kind:'dune'},{r:15,c:edge+35,kind:'dune'});
const ground=M.renderGround;M.renderGround=function(w,h){const result=ground.call(this,w,h);this.decorSprites35||=[];const q=this.mapGeometry(w,h),tw=q.tw,th=tw/2,ox=w/2+(this.panX||0),oy=q.top+q.height/2+(this.panY||0)-th/2,g=this.g;
 objects.forEach((o,i)=>{const x=ox+(o.c-o.r)*tw/2,y=oy+(o.c+o.r)*th/2,visible=x>-tw*15&&x<w+tw*15&&y>-tw*15&&y<h+tw*15;let sp=this.decorSprites35[i];if(!visible){sp?.setVisible(false);return;}if(o.key){sp||=(this.decorSprites35[i]=this.add.image(0,0,'cartoon-'+o.key));this.placeCartoon(sp,o.key,x,y,tw,th,o.rows,o.cols,false).setAlpha(1);return;}
 const poly=(pts,color)=>{const p=pts.map(([a,b])=>({x:x+a*tw,y:y+b*tw}));g.fillStyle(color);g.fillPoints(p,true);g.lineStyle(Math.max(.6,tw*.035),0x966132,.8);g.strokePoints(p,true);};
 if(o.kind==='dune'){g.fillStyle(0xe9ba68,.6);g.fillEllipse(x,y,tw*8,tw*1.5);g.fillStyle(0xf8d58e,.6);g.fillEllipse(x-tw*.5,y-tw*.2,tw*6.4,tw*.9);}
 else if(o.kind==='shrub'){g.lineStyle(Math.max(.7,tw*.065),0xa98443);for(const [dx,dy] of [[-.3,-.4],[-.1,-.55],[.12,-.5],[.3,-.3],[.4,-.12]])g.lineBetween(x,y,x+dx*tw,y+dy*tw);}
 else if(o.kind==='foundation'){for(let j=0;j<5;j++)poly([[j*.4,0],[j*.4+.35,.17],[j*.4+.35,-.17],[j*.4,-.35],[j*.4-.3,-.18],[j*.4-.3,.02]],0xcc8747);}
 else{const size=o.kind==='cliff'?3:1,draw=(dx,dy,s)=>{poly([[-.55,.05],[-.45,-.35],[-.12,-.55],[.35,-.45],[.6,-.12],[.5,.2],[0,.33]].map(([a,b])=>[dx+a*s,dy+b*s]),0xdba160);poly([[dx-.45*s,dy-.35*s],[dx-.12*s,dy-.55*s],[dx+.35*s,dy-.45*s],[dx+.15*s,dy-.12*s],[dx-.2*s,dy]],0xf4c783);};draw(0,0,size);if(size>1){draw(1.9,-.9,2.4);draw(-1.8,.5,1.5);}}
 });return result;};
M.changeZoom=function(factor,x=this.scale.width/2,y=this.scale.height/2){const old=this.mapZoom||1,q=this.mapGeometry(this.scale.width,this.scale.height),min=Math.max(.025,Math.min(this.scale.width/(28*(MAX+70)),q.height/(14*(MAX+70)))),next=Math.max(min,Math.min(12,old*factor)),cx=this.scale.width/2,cy=q.top+q.height/2;this.panX=(x-cx)-(x-cx-(this.panX||0))*next/old;this.panY=(y-cy)-(y-cy-(this.panY||0))*next/old;this.mapZoom=next;this.manualMapZoom=true;this.render();};
M.clampPan=function(){const q=this.mapGeometry(this.scale.width,this.scale.height),mx=q.tw*(MAX+60)/2+this.scale.width*.5,my=q.tw*(MAX+60)/4+this.scale.height*.5;this.panX=Math.max(-mx,Math.min(mx,this.panX||0));this.panY=Math.max(-my,Math.min(my,this.panY||0));};
window.OasisEnvironment35={objects,maxSide:MAX,margin:12};
})();
