'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
context.window = context;
const scripts = ['config', 'core/GameState', 'core/ProgressionSystem', 'core/EconomySystem',
 'core/TimeSystem', 'core/LandFamilySystem', 'core/FarmSystems', 'core/MapLayout'];
for (const script of scripts) {
 const file = path.join(__dirname, '../js', script + '.js');
 vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
}
const {OasisGameState: state, OasisMapLayout: layout, OasisFamilyLand: land,
 OasisEconomy: economy, OasisFarmSystems: farm, OASIS_CONFIG: config} = context;
const s = state.createNew();
s.coins = 5000;
assert.equal(land.footprint(s).length, 4);
const home = layout.objectAt(s, land.footprint(s)[3]);
assert.equal(home.kind, 'home');
assert.equal(layout.move(s, home, 0).ok, true);
assert.equal(layout.objectAt(s, 17).kind, 'home');

const initialCoins = s.coins;
const branch = layout.route(s, 119, 153, 'col');
assert.deepEqual(Array.from(branch), [119, 120, 121, 137, 153]);
assert.deepEqual(Array.from(layout.route(s, 119, 153, 'row')), [119, 135, 151, 152, 153]);
s.tiles[137].crop = 'clover';
assert.equal(layout.layCanal(s, branch, 'col').ok, false);
assert.equal(layout.layCanal(s, [31, 32], 'col').ok, false);
assert.equal(s.coins, initialCoins);
assert.equal(s.tiles[120].canal, false);
s.tiles[137].crop = null;
assert.equal(layout.layCanal(s, branch, 'col').empty.length, 4);
assert.equal(s.coins, initialCoins - 16);
assert.equal(layout.arms(s, 121).length, 2);
assert.equal(layout.move(s, layout.objectAt(s, 153), 155).ok, true);
assert.equal(s.tiles[153].canal, false);
assert.equal(s.tiles[155].canalAxis, 'col');

Object.assign(s.tiles[63], {crop: 'olive', plantedAt: 60000, perennialEstablished: true});
assert.equal(layout.move(s, layout.objectAt(s, 63), 120).ok, false);
assert.equal(layout.move(s, layout.objectAt(s, 63), 64).ok, true);
assert.equal(s.tiles[64].plantedAt, 60000);
assert.equal(s.tiles[64].perennialEstablished, true);
Object.assign(s.tiles[80], {building: 'camel', productionAt: 90000});
assert.equal(layout.move(s, layout.objectAt(s, 80), 95).ok, false);
assert.equal(layout.move(s, layout.objectAt(s, 80), 84).ok, true);
assert.equal(layout.buildingAt(s, 117), 84);
assert.equal(s.tiles[84].productionAt, 90000);
const camel = layout.objectAt(s, 84);
assert.equal(layout.move(s, {...camel, rotated: true}, 84).ok, true);
assert.equal(layout.buildingAt(s, 102), 84);
assert.equal(layout.buildingAt(s, 117), null);
assert.equal(layout.move(s, {...camel, rotated: false}, 84).ok, true);
assert.equal(economy.plant(s, 117, 'clover').ok, false);
assert.equal(layout.move(s, layout.objectAt(s, 119), 106).ok, true);
let saved = state.normalize(JSON.parse(JSON.stringify(s)));
assert.equal(config.wellIndex, 106);
assert.equal(layout.buildingAt(saved, 117), 84);
assert.equal(land.expand(saved).ok, true);
assert.equal(config.wellIndex, 8*20+12);

saved.inventory.watermelon = 57;
assert.equal(economy.sell(saved, 'watermelon', 7).net, 28);
assert.equal(saved.inventory.watermelon, 50);
assert.equal(economy.sell(saved, 'watermelon', 51).ok, false);
assert.equal(saved.inventory.watermelon, 50);

const farmSave = state.createNew(), now = 20_000_000;
farmSave.coins = 1000;
farm.hire(farmSave, 'gardener', now);
farm.hire(farmSave, 'collector', now);
Object.assign(farmSave.tiles[80], {crop:'clover', plantedAt:now-200000});
farm.tick(farmSave, () => true, now);
assert.equal(farmSave.workers.collector.action, 'harvest');
assert.equal(farmSave.workers.collector.target, 80);
assert.equal(farmSave.workers.gardener.action, 'plant');
assert.notEqual(farmSave.workers.gardener.target, 80);
farm.setDayOff(farmSave, 'gardener', true, now);
farm.tick(farmSave, () => true, now+5000);
assert.equal(farmSave.workers.gardener.state, 'idle');
assert.equal(farmSave.tiles[80].crop, null);
console.log('PASS map placement, routes, migration, partial sale and worker roles');
