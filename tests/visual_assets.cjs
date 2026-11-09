'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),p=require('node:path');
const dir=p.resolve(__dirname,'../assets/art'),root=p.resolve(__dirname,'..');
const crop=['clover','watermelon','melon','fig','pomegranate','dates'];
for(const type of crop)for(const stage of ['grow','ripe']){
 const name=type+'-'+stage+'.png';assert(fs.existsSync(p.join(dir,name)),'missing '+name);
}
for(const name of ['building-sheep.png','building-camel.png','well.png','ground-desert.png','market-panorama.jpg']){
 assert(fs.existsSync(p.join(dir,name)),'missing '+name);
 assert(fs.statSync(p.join(dir,name)).size>800,'incomplete '+name);
}
const main=fs.readFileSync(p.join(root,'js/scenes/MainScene.js'),'utf8');
const index=fs.readFileSync(p.join(root,'index.html'),'utf8');
const css=fs.readFileSync(p.join(root,'css/v1.2.css'),'utf8');
const loading=fs.readFileSync(p.join(root,'js/scenes/LoadingScene.js'),'utf8');
assert(main.includes('drawCultivatedSoil'),'no soil');
assert(main.includes('drawCanal'),'no water channels');
assert(main.includes("['canal','building','move'].includes(this.s.tool)"),'grid should be visible only in build mode');
assert(main.includes('renderGround(w,h)'),'ground not rendered');
assert(/css\/v1\.2\.css\?v=2\.1\.0/ .test(index)&&/css\/v1\.3\.css\?v=2\.1\.0/ .test(index),'missing visual CSS');
assert(css.includes('market-panorama.jpg'),'market location without artwork');assert(index.includes('css/v1.4.css'),'v1.4 style missing');
assert(loading.includes("'art-ground'"),'ground not preloaded');
assert(index.includes('market-screen'),'market scene regression');
assert(index.includes('audio-bar'),'sound regression');assert(index.includes('start-menu')&&index.includes('tutorial-screen'),'menu and tutorial regression');assert(index.includes('upgrades-back')&&index.includes('buildings-back'),'missing back navigation');
console.log('PASS visual assets, market panorama, invisible normal grid, build grid, sound and separate scene');
