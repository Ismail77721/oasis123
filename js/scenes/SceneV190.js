/* ОАЗИС v1.9: art-direction-only changes. Game economy and saved data unchanged. */
(function(){'use strict';
 const M=MainScene.prototype;
 const C=window.OASIS_CONFIG;C.version='1.9.0';
 const originalSand=M.drawSandDecoration,originalArtwork=M.renderArtwork;
 // Natural, discontinuous vegetation and stones. Never draws a cell or checkerboard.
 M.drawSandDecoration=function(g,x,y,w,h,i){
  const q=(i*16807)%2147483647;
  if(q%11===0){
   g.fillStyle(0x7d5b36,.14);g.fillEllipse(x+w*.14,y+h*.22,Math.max(2,w*.24),Math.max(2,h*.15));
   g.fillStyle(0xe5bf7f,.83);g.fillEllipse(x+w*.08,y+h*.12,w*.22,h*.14);
   g.fillStyle(0xf8e3b8,.6);g.fillEllipse(x+w*.03,y+h*.10,w*.08,h*.05);
  }else if(q%17===0){
   g.fillStyle(0x56834a,.62);g.fillEllipse(x,y+h*.16,w*.1,h*.18);
   g.lineStyle(Math.max(.7,w*.019),0x56814d,.6);
   g.lineBetween(x,y+h*.15,x-w*.09,y-h*.06);
   g.lineBetween(x,y+h*.15,x+w*.04,y-h*.14);
  }
 };
 M.drawCultivatedSoil=function(g,x,y,tw,th){
  // Organic raised bed with soft edge, topsoil and several soil furrows.
  g.fillStyle(0x5b4128,.14);g.fillEllipse(x+tw*.045,y+th*.23,tw*.93,th*.81);
  g.fillStyle(0x886039,.82);g.fillEllipse(x,y+th*.14,tw*.87,th*.66);
  g.fillStyle(0xad7541,.93);g.fillEllipse(x-tw*.015,y+th*.06,tw*.80,th*.60);
  g.fillStyle(0xbd8c52,.36);g.fillEllipse(x-tw*.09,y,tw*.52,th*.37);
  g.lineStyle(Math.max(.7,tw*.012),0x704b32,.36);
  for(let j=-1;j<=1;j++)g.lineBetween(x-tw*.28,y+th*(.1+j*.065),x+tw*.26,y+th*(.06+j*.065));
  for(let k=0;k<4;k++){
   const a=k*Math.PI/2,px=x+Math.cos(a)*tw*.39,py=y+th*.18+Math.sin(a)*th*.28;
   g.fillStyle(k%2?0xd7a875:0xb78c60,.72);
   g.fillEllipse(px,py,Math.max(2,tw*.11),Math.max(1,th*.12));
  }
 };
 M.drawFence=function(g,ox,oy,tw,th,n){
  const points=[{x:ox,y:oy-th/2},{x:ox+n*tw/2,y:oy+(n-1)*th/2},{x:ox,y:oy+(n-1)*th+th/2},{x:ox-n*tw/2,y:oy+(n-1)*th/2}];
  const beam=Math.max(1.5,tw*.048),post=Math.max(1.5,tw*.038);
  for(let k=0;k<4;k++){
   const a=points[k],b=points[(k+1)%4],count=n*2;
   for(let j=0;j<count;j++){
    // A discreet gate on the southern side remains open for trading trips.
    if(k===1&&(j===count/2||j===count/2-1))continue;
    const t0=j/count,t1=(j+1)/count,
      x0=a.x+(b.x-a.x)*t0,y0=a.y+(b.y-a.y)*t0,
      x1=a.x+(b.x-a.x)*t1,y1=a.y+(b.y-a.y)*t1;
    g.lineStyle(beam+2,0x503723,.27);g.lineBetween(x0,y0+th*.10,x1,y1+th*.10);
    g.lineStyle(beam,0xa26d3d,.9);g.lineBetween(x0,y0,x1,y1);
    if(j%2===0){
     g.lineStyle(post+1,0x533a27,.75);g.lineBetween(x0,y0-th*.23,x0,y0+th*.14);
     g.fillStyle(0xd1a16b,.94);g.fillEllipse(x0,y0-th*.24,post*2.7,post*1.6);
    }
   }
  }
 };
 M.drawCanal=function(g,r,c,i,x,y,tw,th){
  const n=this.neighbors(i).filter(j=>j===C.wellIndex||this.s.tiles[j]?.canal),wet=this.connected.has(i);
  const origin=[...n];if(!origin.length)origin.push(i);
  for(const j of origin){
   const nr=Math.floor(j/C.worldSize),nc=j%C.worldSize,
    dx=j===i?tw*.13:((nc-c)-(nr-r))*tw*.25,
    dy=j===i?th*.1:((nc-c)+(nr-r))*th*.25;
   const x2=x+dx,y2=y+dy;
   g.lineStyle(Math.max(5,tw*.27),0x78583a,.3);g.lineBetween(x,y+th*.07,x2,y2+th*.07);
   g.lineStyle(Math.max(4,tw*.235),0xbf8e5d,1);g.lineBetween(x,y,x2,y2);
   g.lineStyle(Math.max(3,tw*.197),0xf3cf98,.96);g.lineBetween(x,y-th*.014,x2,y2-th*.014);
   g.lineStyle(Math.max(2,tw*.145),wet?0x2583ae:0xa78b6a,.98);g.lineBetween(x,y,x2,y2);
   if(wet){
    g.lineStyle(Math.max(.8,tw*.028),0x7ed0e0,.86);g.lineBetween(x-tw*.016,y-th*.022,x2-tw*.016,y2-th*.022);
   }
  }
  g.fillStyle(0xb88b5b,1);g.fillEllipse(x,y,tw*.31,th*.46);
  g.fillStyle(0xe9c99a,1);g.fillEllipse(x,y-th*.01,tw*.27,th*.37);
  g.fillStyle(wet?0x2694bd:0xa38a6e,1);g.fillEllipse(x,y-th*.02,tw*.20,th*.27);
  if(wet){const phase=(Math.sin(Date.now()/650+i)+1)/2;
   g.fillStyle(0xd3fbf0,.45+phase*.4);g.fillEllipse(x-tw*.03,y-th*.045,Math.max(2,tw*.071),Math.max(1,th*.075));
  }
 };
 M.renderArtwork=function(i,t,x,y,tw,th){
  const okay=originalArtwork.call(this,i,t,x,y,tw,th);
  if(!okay||!this.art?.[i]||!this.art[i].visible)return okay;
  const spr=this.art[i];
  // Taller trees and planted shrubs gain readable silhouettes at mobile resolutions.
  if(t.crop){
   const big={dates:1.19,pomegranate:1.15,fig:1.12,olive:1.14,sidr:1.17};
   const factor=big[t.crop]||1;
   if(factor!==1){spr.setDisplaySize(spr.displayWidth*factor,spr.displayHeight*factor);}
   if(['wheat','barley','clover','flowers'].includes(t.crop)){
    spr.setPosition(x,y+th*.21); // settle in raised soil, not hovering above it
   }
  }
  return okay;
 };
 const oldRender=M.render;
 M.render=function(){
  oldRender.call(this);
  if(!this.s)return;
  const version=document.getElementById('phase');
  if(version)version.textContent=(OasisTimeSystem.getPhase()==='night'?'🌙 Ночь':'☀️ День')+' · v1.9.0';
 };
})();
