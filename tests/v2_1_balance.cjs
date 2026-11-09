const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c=vm.createContext({Date,MainScene:function(){}});c.window=c;
for(const f of ['config','core/GameState','core/ProgressionSystem','core/EconomySystem','core/TimeSystem','core/LandFamilySystem','core/FarmSystems','core/MapLayout','core/SadakaSystem','scenes/SceneV220'])vm.runInContext(fs.readFileSync(__dirname+'/../js/'+f+'.js','utf8'),c);
const G=c.OasisGameState,E=c.OasisEconomy,C=c.OASIS_CONFIG;
let s=G.createNew();assert.equal(s.balanceVersion,2);
s.balanceVersion=1;s.tiles[0]={crop:'watermelon',plantedAt:Date.now()-120000};
s=G.normalize(s);assert(Math.abs((Date.now()-s.tiles[0].plantedAt)/720000-.5)<.01,'migration keeps half-grown crop half-grown');
const once=s.tiles[0].plantedAt;s=G.normalize(s);assert.equal(s.tiles[0].plantedAt,once,'migration once');
s.wellArea=true;s.seedBank.clover=10;assert(!E.plant(s,C.wellIndex+1,'clover').ok,'expanded well occupied');
const manifest=JSON.parse(fs.readFileSync(__dirname+'/../assets/art/approved/manifest.json'));
assert.equal(Object.keys(manifest).length,27);
for(const k of Object.keys(manifest))assert(fs.existsSync(__dirname+'/../assets/art/approved/'+k+'.webp'));
s=G.createNew();s.totalSold=1e9;s.coins=1e6;
const rows=[];
for(const [id,crop]of Object.entries(C.crops)){
 const hours=3,cycles=Math.floor(hours*3600/crop.growSeconds);
 const base=crop.yield+c.OasisProgression.cropBonus(s);
 rows.push([crop.title,crop.growSeconds/60,crop.sellPrice,base,cycles,cycles*base*crop.sellPrice]);
}
console.log('PASS migration, well occupancy, 27 assets; theoretical income per continuously irrigated tile in 3h (no orders):');console.table(rows);
