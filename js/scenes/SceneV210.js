/* Farm editor, aligned irrigation, production feedback and compact mobile controls. */
(function () {
 'use strict';
 const M = MainScene.prototype;
 const C = window.OASIS_CONFIG, L = OasisFamilyLand, layout = OasisMapLayout;
 C.version = '2.1.0';
 const byId = id => document.getElementById(id);
 const editing = scene => ['canal', 'building', 'move', 'remove'].includes(scene.s.tool);
 const round = value => Math.round(value * 100) / 100;

 M.resetEditDraft = function () {
  this.canalDraft = [];
  this.editObject = null;
  this.editStart = null;
  this.editTarget = null;
  this.editRotation = null;
 };
 M.updateEditClock = function (now) {
  const last = this.editClockAt ?? this.s.editorPausedAt;
  const paused = editing(this);
  this.editClockAt = paused ? now : null;
  this.s.editorPausedAt = this.editClockAt;
  if (last == null) return paused;
  const elapsed = Math.max(0, now - last);
  for (const tile of this.s.tiles) {
   if (tile.crop) {
    if (tile.plantedAt) tile.plantedAt += elapsed;
    tile.lastIrrigationTick = now;
   }
   if (tile.productionAt) tile.productionAt += elapsed;
  }
  for (const worker of Object.values(this.s.workers || {})) {
   for (const field of ['paidAt', 'startedAt', 'endsAt', 'dayOffUntil']) {
    if (worker[field]) worker[field] += elapsed;
   }
  }
  return paused;
 };
 M.mapCellAt = function (x, y) {
  const cells = this.wellCell ? [...this.cells, this.wellCell] : this.cells;
  let hit = null, closest = Infinity;
  for (const cell of cells) {
   const distance = Math.abs(x - cell.x) / (cell.w / 2) + Math.abs(y - cell.y) / (cell.h / 2);
   if (distance <= 1 && distance < closest) { hit = cell; closest = distance; }
  }
  return hit;
 };
 M.hitCell = function (x, y) {
  const cell = this.mapCellAt(x, y);
  return cell?.i === C.wellIndex ? null : cell;
 };

 // Check opaque pixels of the actual visible building textures. Empty transparent margins
 // and cast shadows cannot steal a tap from a neighbouring plot.
 const masks = new WeakMap();
 function visibleAt(sprite, x, y) {
  if (!sprite?.visible || !sprite.displayWidth || !sprite.displayHeight) return false;
  const rawU = (x - sprite.x) / sprite.displayWidth + sprite.originX;
  const u = sprite.flipX ? 1 - rawU : rawU;
  const v = (y - sprite.y) / sprite.displayHeight + sprite.originY;
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
  const source = sprite.texture?.getSourceImage?.();
  if (!source?.width || !source.height) return false;
  if (!masks.has(source)) {
   try {
    const canvas = document.createElement('canvas'), width = 96, height = 96;
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    context.drawImage(source, 0, 0, width, height);
    masks.set(source, context.getImageData(0, 0, width, height).data);
   } catch (_) {
    masks.set(source, null);
   }
  }
  const pixels = masks.get(source);
  return !!pixels && pixels[(Math.floor(v * 96) * 96 + Math.floor(u * 96)) * 4 + 3] > 160;
 }
 M.visibleBuildingAt = function (x, y) {
  const candidates = [
   {sprite: this.homeSprite, kind: 'home', anchor: this.s.house.row * this.s.worldSize + this.s.house.col},
   {sprite: this.wellSprite, kind: 'well', anchor: C.wellIndex}
  ];
  this.s.tiles.forEach((tile, i) => {
   if (tile.building) candidates.push({sprite: this.art[i], kind: 'building', anchor: i});
  });
  return candidates.sort((a, b) => (b.sprite?.depth || 0) - (a.sprite?.depth || 0))
   .find(entry => visibleAt(entry.sprite, x, y));
 };
 M.showMapTouch = function (x, y) {
  const touch = byId('map-touch');
  touch.style.left = x + 'px';
  touch.style.top = y + 'px';
  touch.classList.remove('pulse');
  void touch.offsetWidth;
  touch.classList.add('pulse');
 };
 M.onMapTap = function (p) {
  if (this.marketOpen || !byId('start-menu').hidden || !byId('tutorial-screen').hidden ||
      document.querySelector('.ui-modal:not([hidden])')) return;
  this.showMapTouch(p.x, p.y);
  const cell = this.mapCellAt(p.x, p.y), index = cell?.i;
  const occupant = layout.objectAt(this.s, index);
  if (this.s.tool === 'canal') {
   if (!cell) return;
   this.canalDraft ||= [];
   const chosen = this.canalDraft.indexOf(index);
   if (chosen >= 0) this.canalDraft.splice(chosen, 1);
   else this.canalDraft.push(index);
   this.render();
   return;
  }
  if (this.s.tool === 'building') {
   if (cell) { this.editTarget = index; this.render(); }
   return;
  }
  if (this.s.tool === 'move') {
   if (!this.editObject) {
    this.editObject = occupant || this.visibleBuildingAt(p.x, p.y) || null;
    if (!this.editObject) this.notify('Коснись объекта, который хочешь переставить');
   } else if (cell) this.editTarget = index;
   this.render();
   return;
  }
  if (this.s.tool === 'remove') {
   if (occupant && ['crop', 'canal'].includes(occupant.kind)) this.confirmRemoval(occupant.anchor);
   else this.notify('Выбери растение или канал');
   return;
  }
  const object = this.visibleBuildingAt(p.x, p.y) || occupant;
  if (object?.kind === 'home') { this.openHome(); return; }
  if (object?.kind === 'well') { this.openWell(); return; }
  if (object?.kind === 'building') { this.playSound('click'); this.openFarm(object.anchor); return; }
  if (!cell) return;
  if(occupant?.kind==='crop'&&occupant.anchor!==index){const a=this.cells.find(c=>c.i===occupant.anchor);if(a)return this.onMapTap({x:a.x,y:a.y});}
  const tile = this.s.tiles[index];
  this.selectedTile = index;
  if (tile.canal) { this.openCropCard(index); return; }
  if (tile.crop) {
   if (this.quickHarvest(index)) { this.save(); this.render(); this.renderQuests(); }
   else this.notify(C.crops[tile.crop].title + ' · ' +
    (this.irrigated(index) ? 'до сбора ' + Math.ceil(OasisTimeSystem.secondsLeft(tile) / 60) + ' мин' : 'нужно орошение'));
   return;
  }
  if (!this.irrigated(index)) this.notify('Сначала проведи канал от колодца к грядке');
  else { this.openPicker(index); this.guideEvent('openPlot'); }
  this.render();
 };
 M.editPreview = function () {
  const mode = this.s.tool, target = this.editTarget;
  if (mode === 'canal') {
   const path = this.canalDraft || [];
   if (!path.length) return {prompt: 'Коснись клеток канала. Повторное касание отменяет выбор'};
   return {...layout.canalQuote(this.s, path), area: path, path};
  }
  const object = mode === 'building' ? {kind: 'building', id: this.s.selectedBuilding, rotated: this.editRotation} :
   this.editObject ? {...this.editObject, rotated: this.editRotation} : null;
  if (!object || target == null) return {prompt: object ? 'Коснись нового места' : 'Коснись объекта для переноса'};
  const prior = object.kind === 'home' ? !!this.s.house.flipped : !!this.s.tiles[object.anchor]?.buildingRotated;
  if (object.anchor === target && (object.rotated == null || object.rotated === prior)) return {reason: 'Выбери новое место'};

  const result = layout.check(this.s, target, object);
  if (!result.ok || mode !== 'building') return result;
  const cost = OASIS_BUILDINGS[object.id]?.cost;
  if (!cost || this.s.coins < cost) return {...result, ok: false, reason: 'Не хватает монет для постройки'};
  return {...result, price: cost};
 };
 M.applyEdit = function () {
  const preview = this.editPreview();
  if (!preview.ok) return;
  this.updateEditClock(Date.now());
  if (this.s.tool === 'canal') {
   const result = layout.layCanal(this.s, preview.path, this.editAxis);
   if (!result.ok) { this.notify(result.reason); return; }
   this.playSound('canal');
   this.guideEvent('canalBuilt');
   this.notify('Канал проложен · ' + result.empty.length + ' кл.');
  } else if (this.s.tool === 'building') {
   const id = this.s.selectedBuilding, cfg = OASIS_BUILDINGS[id];
   if (!cfg || cfg.unlock > this.getLevel()) return;
   const tile = this.s.tiles[this.editTarget];
   Object.assign(tile, {building: id, productionAt: 0, buildingArea: true, buildingRotated: Boolean(this.editRotation)});
   this.s.coins = round(this.s.coins - preview.price);
   this.s.stats.buildingsBuilt = (this.s.stats.buildingsBuilt || 0) + 1;
   this.notify(cfg.title + ' · постройка готова');
   this.playSound('build'); this.s.tool = 'plant';
  } else {
   const result = layout.move(this.s, {...this.editObject, rotated: this.editRotation}, this.editTarget);
   if (!result.ok) { this.notify(result.reason); return; }
   this.playSound('build'); this.notify('Перестановка сохранена');
  }
  this.selectedTile = null;
  this.resetEditDraft();
  this.save(); this.render(); this.renderQuests();
 };
 M.drawEditPreview = function () {
  const controls = byId('edit-controls');
  controls.hidden = !editing(this) || this.marketOpen;
  if (controls.hidden) { this.resetEditDraft(); return; }
  const preview = this.editPreview(), moving = this.s.tool === 'move';
  const axis = byId('edit-axis');
  const canalMode = this.s.tool === 'canal';
  const canRotate = this.s.tool === 'building' || ['home','building'].includes(this.editObject?.kind);
  axis.hidden = canalMode || !canRotate;
  axis.textContent = canalMode ? (this.editAxis === 'row' ? 'Сначала по рядам' : 'Сначала по столбцам') : 'Развернуть вход';
  axis.setAttribute('aria-label', canalMode ? 'Сменить направление канала' : 'Развернуть вход');
  axis.setAttribute('aria-pressed', String(canalMode ? this.editAxis === 'row' : !!this.editRotation));
  byId('edit-apply').disabled = !preview.ok;
  byId('edit-apply').textContent = preview.price != null ? 'Подтвердить · ' + preview.price + ' 🪙' : 'Подтвердить';
  byId('edit-status').textContent = preview.reason || preview.prompt ||
   (moving ? 'Место свободно' : 'Подтверди размещение');
  byId('mode-chip').textContent = moving ? 'Перестановка · рост и работа на паузе' :
   this.s.tool === 'canal' ? 'Каналы · выбери клетки → подтверди' : 'Строительство · выбери участок';
  const picked = this.editObject;
  const selection = picked?.kind === 'home' ? L.footprint(this.s) :
   picked?.kind === 'building' ? layout.buildingArea(this.s, picked.anchor) : picked ? [picked.anchor] : [];
  for (const [indices, color] of [[selection, 0xffd065], [preview.area || [], preview.ok ? 0x91e1a0 : 0xf19e75]]) {
   for (const i of indices) {
    const c = i === C.wellIndex ? this.wellCell : this.cells.find(cell => cell.i === i);
    if (!c) continue;
    const {x, y, w, h} = c;
    const points = [{x, y:y-h/2}, {x:x+w/2,y}, {x,y:y+h/2}, {x:x-w/2,y}];
    this.overlay.fillStyle(color, .22); this.overlay.fillPoints(points, true);
    this.overlay.lineStyle(2, color, .9); this.overlay.strokePoints(points, true);
   }
  }
  if (preview.path) {
   const planned = new Set(preview.path), color = preview.ok ? 0x92e7ec : 0xfaad89;
   for (const i of planned) {
    const cell = i === C.wellIndex ? this.wellCell : this.cells.find(c => c.i === i);
    if (!cell) continue;
    this.overlay.lineStyle(Math.max(2, cell.w * .07), color, .95);
    for (const arm of layout.arms(this.s, i, planned, this.editAxis)) {
     this.overlay.lineBetween(cell.x, cell.y, cell.x + arm.x * cell.w / 4, cell.y + arm.y * cell.h / 4);
    }
   }
  }
 };
 M.drawCanal = function (g, r, c, index, x, y, tw, th) {
  const arms = layout.arms(this.s, index);
  const wet = index === C.wellIndex || this.connected.has(index);
  const center = wet ? 0x318bac : 0x94724d;
  const layers = [[.21, 0x755131], [.17, 0xd0a473], [.125, center]];
  for (const [scale, color] of layers) {
   const width = Math.max(1, tw * scale);
   g.lineStyle(width, color, 1);
   for (const arm of arms) g.lineBetween(x, y, x + arm.x * tw / 4, y + arm.y * th / 4);
   g.fillStyle(color, 1);
   g.fillCircle(x, y, width / 2);
  }
  if (wet) {
   g.lineStyle(Math.max(.7, tw * .023), 0x83cbd8, .68);
   for (const arm of arms) g.lineBetween(x, y, x + arm.x * tw / 4, y + arm.y * th / 4);
  }
 };
 M.renderGround = function () {
  // The base color is screen-wide. All rocks and vegetation come from map coordinates.
  return false;
 };

 M.openFarm = function (index) {
  const tile = this.s.tiles[index], cfg = OASIS_BUILDINGS[tile?.building];
  if (!cfg) return;
  this.openFarmIndex = index;
  const status = byId('farm-status'), error = byId('farm-error'), actions = byId('farm-actions');
  const livestock = ['sheep', 'camel'].includes(tile.building);
  const name = L.labels(cfg.feed);
  const button = document.createElement('button');
  button.className = 'farm-primary'; button.type = 'button';
  this.updateFarmStatus = () => {
   const left = Math.max(0, Math.ceil((tile.productionAt - Date.now()) / 1000));
   const count = this.s.inventory[cfg.feed] || 0;
   status.textContent = left ? 'До готовности ' + left + ' сек.' : tile.productionAt ? 'Продукция готова' :
    (livestock ? 'Корм' : 'Сырьё') + ' · ' + name + ' × ' + cfg.feedAmount + ' · в амбаре ' + count;
   button.disabled = left > 0;
   button.textContent = left ? 'Производство идёт' : tile.productionAt ? 'Собрать продукцию' :
    livestock ? 'Накормить и запустить' : 'Загрузить сырьё и запустить';
  };
  button.addEventListener('click', () => {
   if (tile.productionAt > Date.now()) return;
   const count = this.s.inventory[cfg.feed] || 0;
   if (!tile.productionAt && (count < cfg.feedAmount || this.s.water < cfg.water)) {
    const missing = [];
    if (count < cfg.feedAmount) missing.push(name + ' × ' + (cfg.feedAmount - count));
    if (this.s.water < cfg.water) missing.push('вода × ' + (cfg.water - this.s.water));
    error.textContent = 'Не хватает ' + (livestock ? 'корма' : 'сырья') + ' · ' + missing.join(', ');
    error.hidden = false; this.playSound('error');
    return;
   }
   if (tile.productionAt) {
    const bonus = cfg.product === 'wool' ? OasisProgression.woolBonus(this.s) :
     cfg.product === 'camelMilk' ? OasisProgression.milkBonus(this.s) : 0;
    this.s.inventory[cfg.product] = (this.s.inventory[cfg.product] || 0) + cfg.amount + bonus + Math.max(0,(tile.buildingLevel||1)-1);
    tile.productionAt = 0;
    this.notify('Продукция добавлена в амбар'); this.playSound('collect');
   } else {
    this.s.inventory[cfg.feed] -= cfg.feedAmount;
    this.s.water -= cfg.water;
    tile.productionAt = Date.now() + cfg.duration * 1000 / (1 + .1 * Math.max(0,(tile.buildingLevel||1)-1));
    this.notify('Производство началось'); this.playSound('plant');
   }
   error.hidden = true;
   this.save(); this.render();
  });
  byId('farm-title').textContent = cfg.title;
  error.hidden = true; actions.replaceChildren(button);
  byId('farm').hidden = false; this.updateFarmStatus();
 };
 const oldRender = M.render, oldCreate = M.create, oldBack = M.goBack;
 M.render = function () {
  if (!this.s) return;
  if (!this.manualMapZoom) this.mapZoom = this.scale.width < 600 && this.scale.height > this.scale.width ? 3.6 : 2.8;
  const profileChanged = this.questProfile !== this.s;
  if (profileChanged) { this.questProfile = this.s; this.completedQuests = null; }
  oldRender.call(this);
  const cell = this.cells[0];
  this.wellCell = this.well && cell ? {i:C.wellIndex,x:this.well.x,y:this.well.y,w:cell.w,h:cell.h} : null;
  const phase = byId('phase');
  if (phase) phase.textContent = (OasisTimeSystem.getPhase() === 'night' ? 'Ночь' : 'День') + ' · v' + C.version;
  const hud = byId('family-hud');
  if (hud && this.scale.width < 520) hud.textContent = hud.textContent.replace(/^Уровень /, 'Ур. ');
  if (byId('map-touch')) this.drawEditPreview();
  if (!byId('farm').hidden) this.updateFarmStatus?.();
  const daily = OasisDailyQuests.overview(this.s);
  const ready = [
   ...daily.filter(q => !q.claimed && q.progress >= q.goal).map(q => ['daily-'+this.s.dailyQuests.date+'-'+q.id,q.title]),
   ...this.getQuests().flatMap((q,i) => q.value >= q.goal && !this.s.claimedQuests.includes(i) ? [['quest-'+i,q.title]] : [])
  ];
  const news = this.completedQuests ? ready.filter(([id]) => !this.completedQuests.has(id)) : [];
  if (news.length) {
   const banner = byId('quest-banner');
   banner.textContent = news.length === 1 ? 'Задание выполнено · ' + news[0][1] : 'Выполнено заданий · ' + news.length;
   banner.hidden = false; this.notify(banner.textContent);
   clearTimeout(this.questBannerTimer);
   this.questBannerTimer = setTimeout(() => { banner.hidden = true; }, 4700);
   if (!byId('quests-panel').hidden) this.renderQuests();
  }
  this.completedQuests = new Set(ready.map(([id])=>id));
 };
 M.goBack = function () {
  if (editing(this) && !this.marketOpen && byId('start-menu').hidden &&
      !document.querySelector('.ui-modal:not([hidden])')) {
   if (this.editTarget != null || this.editObject || this.editStart != null) { this.resetEditDraft(); this.render(); }
   else byId('stop-build').click();
   return;
  }
  return oldBack.call(this);
 };
 M.create = function () {
  const marker = document.createElement('div');
  marker.id = 'map-touch'; marker.setAttribute('aria-hidden','true');
  document.body.append(marker);
  this.editAxis = 'col';
  this.resetEditDraft();
  oldCreate.call(this);
  byId('edit-axis').addEventListener('click', () => {
   if (this.s.tool === 'canal') this.editAxis = this.editAxis === 'row' ? 'col' : 'row';
   else {
    const object = this.editObject;
    const prior = object?.kind === 'home' ? !!this.s.house.flipped : !!this.s.tiles[object?.anchor]?.buildingRotated;
    this.editRotation = !(this.editRotation ?? prior);
    if (object && this.editTarget == null) this.editTarget = object.anchor;
   }
   this.render();
  });
  byId('edit-apply').addEventListener('click', () => this.applyEdit());
  byId('edit-cancel').addEventListener('click', () => { this.resetEditDraft(); this.render(); });
  this.setupFullscreen();
 };
 M.setupFullscreen = function () {
  const button = byId('fullscreen-toggle'), root = document.documentElement;
  const telegram = () => window.Telegram?.WebApp;
  let boundTelegram;
  const sync = () => {
   const app = telegram();
   const active = Boolean(app?.isFullscreen || document.fullscreenElement || window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches);
   button.setAttribute('aria-pressed', String(active));
   button.title = active ? 'Выйти из полного экрана' : 'Полноэкранный режим';
   button.setAttribute('aria-label', button.title);
   for (const side of ['top','right','bottom','left']) {
    const inset = (Number(app?.safeAreaInset?.[side]) || 0)+(Number(app?.contentSafeAreaInset?.[side]) || 0);
    root.style.setProperty('--telegram-' + side, inset + 'px');
   }
  };
  const help = () => this.notify('Для полного экрана открой игру как Mini App или добавь её на экран «Домой»');
  document.addEventListener('fullscreenerror', help);
  const bind = () => {
   const app = telegram();
   if (app && app !== boundTelegram) {
    boundTelegram = app;
    app.ready?.();
    if(app.initData){app.expand?.();if(app.isVersionAtLeast?.("7.7"))app.disableVerticalSwipes?.();}
    app.onEvent?.("viewportChanged",sync);
    app.onEvent?.('fullscreenChanged', sync);
    app.onEvent?.('safeAreaChanged', sync);
    app.onEvent?.('contentSafeAreaChanged', sync);
    app.onEvent?.('fullscreenFailed', help);
   }
   sync();
  };
  document.addEventListener('fullscreenchange', sync);
  document.querySelector('script[src*="telegram-web-app"]')?.addEventListener('load',bind);
  button.addEventListener('click', async () => {
   bind();
   const app = telegram();
   if (!document.fullscreenElement && !app?.isFullscreen) this.notify('Открываю полноэкранный режим…');
   try {
    if (app?.initData && app.isVersionAtLeast?.('8.0') && app.requestFullscreen) {
     if (app.isFullscreen) app.exitFullscreen();
     else {
      app.requestFullscreen();
      setTimeout(()=>{if(!app.isFullscreen)help();},1500);
     }
    } else if (document.fullscreenElement) await document.exitFullscreen();
    else if (root.requestFullscreen && document.fullscreenEnabled) {
     const request = root.requestFullscreen();
     setTimeout(()=>{if(!document.fullscreenElement)help();},1500);
     await request;
     if (!document.fullscreenElement) help();
    }
    else help();
   } catch (_) { help(); }
  });
  bind();
 };
})();
