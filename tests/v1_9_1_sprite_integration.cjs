'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const names={
 crop:'clover watermelon wheat barley cumin flowers melon dates fig pomegranate olive sidr'.split(' '),
 building:'home1 home2 sheep camel well well2 storage mill loom tools market sadaka apiary'.split(' '),
 terrain:'sand fertile plowed grass rocks fence-straight fence-corner gate canal-straight canal-corner canal-t canal-cross canal-source path'.split(' '),
 icon:'build orders seeds barn bazaar home help charity harvest plant remove upgrade workshop trade'.split(' ')
};
let sprites=0;
for(const [kind,items] of Object.entries(names))for(const id of items){
 const p=path.join(root,'assets/sprites',kind+'-'+id+'.png');
 const b=fs.readFileSync(p);assert(b.length>2000,`Missing/empty sprite ${kind}-${id}`);
 assert.equal(b.subarray(1,4).toString(),'PNG','PNG signature');
 assert.equal(b.readUInt8(25),6,`Must be actual RGBA transparency, not pasted screenshots: ${id}`);
 assert(b.readUInt32BE(16)>75&&b.readUInt32BE(20)>75,`Sprite not large enough: ${id}`);
 sprites++;
}
assert.equal(sprites,53);
for(const id of names.crop){
 for(const stage of ['grow','ripe'])assert(fs.statSync(path.join(root,'assets/art',id+'-'+stage+'.png')).size>3000);
}
for(const id of ['sheep','camel','apiary','mill','loom'])assert(fs.statSync(path.join(root,'assets/art/building-'+id+'.png')).size>3000);
const html=read('index.html'),load=read('js/scenes/LoadingScene.js'),scene=read('js/scenes/SceneV200.js');
assert.match(html,/SceneV200\.js\?v=2\.0\.0/);
assert.match(load,/sprite-terrain-/);
assert.match(load,/sprite-icon-/);
for(const id of ['produce','seeds','orders','tools','sadaka'])assert.match(html,new RegExp('data-stall="'+id+'"[^>]*><img src="assets/sprites/'));
assert(!html.includes('assets/art/ref-market.png'), 'Old screenshot extract should not be on market');
assert.match(read('js/scenes/SceneV210.js'),/M\.drawCanal = function/);
assert.match(scene,/M\.drawFence=function/);
assert.match(scene,/M\.renderArtwork=function/);
assert.match(scene,/M\.drawCultivatedSoil=function/);
assert.match(html,/class="ui-sprite"/);
// Actual Phaser-like sprite creation: the art hooks must place image textures, not g.fillCircle() geometry.
class MainScene{}
const calls=[];
const image=(x,y,key)=>{
 const s={texture:{key},displayWidth:0,displayHeight:0,visible:true,
  setOrigin(){return this;},setPosition(x,y){this.x=x;this.y=y;return this;},
  setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},
  setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;},
  setTexture(k){this.texture.key=k;return this;},setTint(){return this;},clearTint(){return this;},
  setFlipX(){return this;},setFlipY(){return this;}};
 calls.push(key);return s;
};
const C={version:'1.9.0',worldSize:16,wellIndex:119};
MainScene.prototype.drawFence=function(){};MainScene.prototype.drawCanal=function(){};MainScene.prototype.drawSandDecoration=function(){};
MainScene.prototype.renderArtwork=function(){return false;};MainScene.prototype.renderWellSprite=function(){return false;};
MainScene.prototype.render=function(){};
const ctx={MainScene,window:{OASIS_CONFIG:C},OASIS_CONFIG:C,OasisTimeSystem:{getPhase:()=> 'day',isReady:()=>true},document:{getElementById:()=>null}};
vm.runInNewContext(scene,ctx);
assert.equal(C.version,'1.9.1');
const sc=new MainScene();sc.add={image};sc.textures={exists:()=>true,get:()=>({getSourceImage:()=>({width:300,height:250})})};
sc.art=[];sc.s={tiles:Array.from({length:256},()=>({})),seedBank:{},inventory:{}};sc.connected=new Set([120]);
sc.s.tiles[80]={crop:'dates'};sc.renderArtwork(80,sc.s.tiles[80],130,170,40,20);
assert(calls.includes('art-dates-ripe'),'palm art never rendered');
assert(sc.art[80].displayWidth>40&&sc.art[80].displayWidth<70,'trees should overhang a square tile with reduced width');
sc.drawFence({},230,30,40,20,16);
assert(calls.includes('sprite-terrain-fence-straight'),'fence drawn as old geometry instead of sprites');
assert(calls.includes('sprite-terrain-gate'),'actual gate texture missing');
// Progression should continue beyond level 20 rather than end the game.
const progSrc=read('js/core/ProgressionSystem.js');
const pctx={window:{},OASIS_TOOLS:{}};vm.runInNewContext(progSrc,pctx);
const progress=pctx.window.OasisProgression;
const at20={totalSold:26500},at21={totalSold:30500},at22={totalSold:35050};
assert.equal(progress.level(at20),20);
assert.equal(progress.level(at21),21);
assert.equal(progress.level(at22),22);
assert.equal(progress.nextTarget(at20),30500);
assert.equal(progress.nextTarget(at21),35050);
console.log('PASS 53 transparent sprite files, crop/building replacement, market sprites, Phaser rendering hooks, dynamic fence/canal, uncapped levels');
