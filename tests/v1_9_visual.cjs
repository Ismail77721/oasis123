const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const r=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(r,file),'utf8');
const html=read('index.html'),css=read('css/v1.9.css'),src=read('js/scenes/SceneV190.js');
assert.match(html,/SceneV190\.js\?v=2\.1\.0/ );
assert.match(html,/css\/v1\.9\.css\?v=2\.1\.0/ );
assert(!html.includes('plaza-diamond'), 'The market diamond must be gone');
assert(!html.includes('plaza-path'), 'The two old market paths must be gone');
assert.match(css,/market-plaza-ground\.jpg/);
assert.match(css,/market-stall\[data-stall=sadaka\]/);
assert.match(src,/1\.9\.0/);
for(const n of ['market-plaza-ground.jpg','ground-desert.png','barley-ripe.png','wheat-ripe.png','cumin-ripe.png','flowers-ripe.png']){
 const p=path.join(r,'assets/art',n);assert(fs.statSync(p).size>2000,`real art asset ${n}`);
}
const calls=[];
const g={fillStyle:(...a)=>calls.push(['fillStyle',...a]),fillEllipse:(...a)=>calls.push(['fillEllipse',...a]),lineStyle:(...a)=>calls.push(['lineStyle',...a]),lineBetween:(...a)=>calls.push(['lineBetween',...a])};
class MainScene{}
MainScene.prototype.drawSandDecoration=function(){};
MainScene.prototype.drawCultivatedSoil=function(){};
MainScene.prototype.drawFence=function(){};
MainScene.prototype.drawCanal=function(){};
MainScene.prototype.renderArtwork=function(){return false;};
MainScene.prototype.render=function(){};
const cfg={version:'1.8.0',worldSize:16,wellIndex:119};
const document={getElementById:()=>null};
vm.runInNewContext(src,{MainScene,OASIS_CONFIG:cfg,document,OasisTimeSystem:{getPhase:()=> 'day'},window:{OASIS_CONFIG:cfg}}, {filename:'SceneV190.js'});
assert.equal(cfg.version,'1.9.0');
const scene=new MainScene();scene.connected=new Set([120]);scene.s={tiles:Array.from({length:256},(_,i)=>({canal:i===120}))};scene.neighbors=i=>[i-1,i+1];
scene.drawSandDecoration(g,30,30,40,20,12);
scene.drawCultivatedSoil(g,30,30,40,20);
scene.drawFence(g,180,70,45,22,16);
scene.drawCanal(g,7,8,120,30,30,40,20);
assert(calls.some(e=>e[0]==='fillEllipse'),'The patch should draw textured farm beds');
assert(calls.some(e=>e[0]==='lineBetween'),'The patch should draw fences and channels');
console.log('PASS v1.9: interactive market without diamond, new art assets, layered farm decorations, preserved scene hooks');
