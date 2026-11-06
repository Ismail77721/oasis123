class LoadingScene extends Phaser.Scene {
 constructor(){super('LoadingScene');}
 preload(){
  const crops=['watermelon','clover','melon','fig','pomegranate','dates','olive','sidr','cumin','flowers','barley','wheat'];
  for(const id of crops)for(const stage of ['grow','ripe'])this.load.image('art-'+id+'-'+stage,'assets/art/'+id+'-'+stage+'.png');
  this.load.image('art-building-sheep','assets/art/building-sheep.png');
  this.load.image('art-building-camel','assets/art/building-camel.png');
  for(const id of ['apiary','oilpress','olivepress','mill','loom'])this.load.image('art-building-'+id,'assets/art/building-'+id+'.png');
  for(let n=1;n<=5;n++)this.load.image('art-home-'+n,'assets/art/home-'+n+'.png');
  this.load.image('art-well','assets/art/well.png');
  this.load.image('art-ground','assets/art/ground-desert.png');
  // Game-ready, separately extracted transparent concept sprites. All files are local.
  const terrain=['sand','fertile','plowed','grass','rocks','fence-straight','fence-corner','gate','canal-straight','canal-corner','canal-t','canal-cross','canal-source','path'];
  for(const id of terrain)this.load.image('sprite-terrain-'+id,'assets/sprites/terrain-'+id+'.png');
  const market=['market','tools','sadaka','storage','well2','home1','home2'];
  for(const id of market)this.load.image('sprite-building-'+id,'assets/sprites/building-'+id+'.png');
  const icons=['build','orders','seeds','barn','bazaar','home','help','charity','harvest','plant','remove','upgrade','workshop','trade'];
  for(const id of icons)this.load.image('sprite-icon-'+id,'assets/sprites/icon-'+id+'.png');
  this.load.on('loaderror',file=>console.warn('ОАЗИС: не загружен ресурс', file?.key));
 }
 create(){this.scene.start('MainScene');}
}
