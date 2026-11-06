/* Placement and canal geometry on the same square logical grid as the farm. */
(function () {
 'use strict';
 const C = window.OASIS_CONFIG;
 const land = () => window.OasisFamilyLand;
 const reject = reason => ({ok: false, reason});
 const directions = [
  {r: -1, c: 0, x: 1, y: -1, axis: 'row'},
  {r: 1, c: 0, x: -1, y: 1, axis: 'row'},
  {r: 0, c: -1, x: -1, y: -1, axis: 'col'},
  {r: 0, c: 1, x: 1, y: 1, axis: 'col'}
 ];
 const size = s => s.worldSize || C.worldSize;
 const valid = (s, i) => Number.isInteger(i) && i >= 0 && i < size(s) ** 2;
 function rectangle(s, anchor, rows, cols) {
  if (!valid(s, anchor)) return null;
  const n = size(s), row = Math.floor(anchor / n), col = anchor % n;
  if (row + rows > n || col + cols > n) return null;
  return Array.from({length: rows * cols}, (_, i) => (row + Math.floor(i / cols)) * n + col + i % cols);
 }
 const buildingSize = (id, rotated) => ['sheep', 'camel'].includes(id) ? (rotated ? [2, 3] : [3, 2]) : [2, 2];
 function buildingArea(s, i, t = s.tiles[i]) {
  return t?.buildingArea === true ? rectangle(s, i, ...buildingSize(t.building,t.buildingRotated)) || [i] : [i];
 }
 function buildingAt(s, i) {
  if (!valid(s, i)) return null;
  if (s.tiles[i]?.building) return i;
  const n = size(s), row = Math.floor(i / n), col = i % n;
  for (let r = Math.max(0, row - 2); r <= row; r++) {
   for (let c = Math.max(0, col - 2); c <= col; c++) {
    const anchor = r * n + c, tile = s.tiles[anchor];
    if (tile?.building && tile.buildingArea === true && buildingArea(s, anchor, tile).includes(i)) return anchor;
   }
  }
  return null;
 }
 function objectAt(s, i) {
  if (!valid(s, i)) return null;
  if (i === C.wellIndex) return {kind: 'well', anchor: i};
  if (land().isHome(s, i)) return {kind: 'home', anchor: s.house.row * size(s) + s.house.col};
  const building = buildingAt(s, i);
  if (building !== null) return {kind: 'building', anchor: building};
  if (s.tiles[i]?.crop) return {kind: 'crop', anchor: i};
  if (s.tiles[i]?.canal) return {kind: 'canal', anchor: i};
  return null;
 }
 function areaFor(s, target, object) {
  if (object.kind === 'home') {
   const side = land().houseSide(s.house);
   return rectangle(s, target, side, side);
  }
  if (object.kind === 'building') return rectangle(s, target, ...buildingSize(object.id || s.tiles[object.anchor]?.building, object.rotated ?? s.tiles[object.anchor]?.buildingRotated));
  return rectangle(s, target, 1, 1);
 }
 function check(s, target, object) {
  const area = areaFor(s, target, object);
  if (!area) return reject('Участок выходит за границы фермы');
  for (const i of area) {
   const occupant = objectAt(s, i);
   if (occupant && (occupant.anchor !== object.anchor || occupant.kind !== object.kind)) {
    return reject('Участок занят. Выбери свободное место');
   }
  }
  return {ok: true, area};
 }
 function move(s, object, target) {
  if (objectAt(s, object.anchor)?.kind !== object.kind) return reject('Объект уже изменился. Выбери его снова');
  const priorRotation = object.kind === 'home' ? !!s.house.flipped : !!s.tiles[object.anchor]?.buildingRotated;
  const rotating = ['home','building'].includes(object.kind) && object.rotated != null && object.rotated !== priorRotation;
  if (object.anchor === target && !rotating) return reject('Выбери новое место');
  const result = check(s, target, object);
  if (!result.ok) return result;
  const n = size(s);
  if (object.kind === 'home') Object.assign(s.house, {row: Math.floor(target / n), col: target % n, flipped: object.rotated ?? priorRotation});
  else if (object.kind === 'well') {
   s.wellPosition = {row: Math.floor(target / n), col: target % n};
   C.wellIndex = target;
  } else {
   s.tiles[target] = {...s.tiles[object.anchor]};
   if (object.kind === 'building') {
    s.tiles[target].buildingArea = true;
    s.tiles[target].buildingRotated = object.rotated ?? priorRotation;
   }
   if (object.anchor !== target) s.tiles[object.anchor] = OasisGameState.tile();
   for (const worker of Object.values(s.workers || {})) {
    if (worker.target === object.anchor) worker.target = target;
    if (worker.from === object.anchor) worker.from = target;
   }
  }
  return result;
 }
 function route(s, start, end, axis) {
  if (!valid(s, start) || !valid(s, end)) return [];
  const n = size(s), endRow = Math.floor(end / n), endCol = end % n;
  let row = Math.floor(start / n), col = start % n;
  const path = [start];
  function walkRows() {
   while (row !== endRow) {
    row += Math.sign(endRow - row);
    path.push(row * n + col);
   }
  }
  function walkCols() {
   while (col !== endCol) {
    col += Math.sign(endCol - col);
    path.push(row * n + col);
   }
  }
  if (axis === 'row') { walkRows(); walkCols(); }
  else { walkCols(); walkRows(); }
  return path;
 }
 function canalQuote(s, path) {
  if (!path.length) return reject('Выбери участок для канала');
  if (new Set(path).size !== path.length) return reject('Клетки канала повторяются');
  const n = size(s), empty = [];
  for (let index = 0; index < path.length; index++) {
   const i = path[index], prior = path[index - 1];
   if (!valid(s, i) || (index && Math.abs(Math.floor(i/n)-Math.floor(prior/n)) + Math.abs(i%n-prior%n) !== 1)) {
    return reject('Клетки канала должны соприкасаться сторонами');
   }
   const object = objectAt(s, i);
   if (!object) empty.push(i);
   else if (object.kind === 'canal') continue;
   else if (object.kind === 'well' && (index === 0 || index === path.length - 1)) continue;
   else return reject('На пути канала есть занятый участок. Смени направление или конечную клетку');
  }
  if (!empty.length) return reject('На этом участке канал уже проложен');
  const price = empty.length * OasisProgression.canalPrice(s);
  if (s.coins < price) return reject('Нужно ' + price + ' монет для этого маршрута');
  return {ok: true, empty, price};
 }
 function layCanal(s, path, axis) {
  const result = canalQuote(s, path);
  if (!result.ok) return result;
  for (const i of result.empty) {
   s.tiles[i].canal = true;
   s.tiles[i].canalAxis = axis;
  }
  s.coins -= result.price;
  s.stats.canalsBuilt = (s.stats.canalsBuilt || 0) + result.empty.length;
  return result;
 }
 function arms(s, i, planned = null, axis = null) {
  const n = size(s), row = Math.floor(i / n), col = i % n;
  const connected = directions.filter(d => {
   const r = row + d.r, c = col + d.c, j = r * n + c;
   return r >= 0 && c >= 0 && r < n && c < n && (j === C.wellIndex || s.tiles[j]?.canal || planned?.has(j));
  });
  return connected.length ? connected : directions.filter(d => d.axis === (axis || s.tiles[i].canalAxis || 'col'));
 }
 window.OasisMapLayout = {buildingSize, buildingArea, buildingAt, objectAt, check, move, route, canalQuote, layCanal, arms};
})();
