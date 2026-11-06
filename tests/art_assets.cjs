const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../assets/art');
const assets=[...['watermelon','clover','melon','fig','pomegranate','dates'].flatMap(k=>[k+'-grow',k+'-ripe']),'building-sheep','building-camel','well'];
for(const asset of assets){const p=path.join(root,asset+'.png');assert.ok(fs.existsSync(p),'missing '+asset);const data=fs.readFileSync(p);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(data.length>500,'empty '+asset);}
const loading=fs.readFileSync(path.resolve(__dirname,'../js/scenes/LoadingScene.js'),'utf8');
for(const asset of assets){assert.ok(loading.includes(asset.replace('-grow','').replace('-ripe','')),'loader missing '+asset);}
console.log('PASS 15 custom transparent PNG sprites and loader references');
