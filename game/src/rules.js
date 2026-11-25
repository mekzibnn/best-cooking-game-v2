// rules.js — pure game rules for Dapur Senja. No Phaser import:
// the scenes draw this state and send input actions back, and node --test
// can run the whole cooking loop without a browser.
import {
  INGREDIENTS, RECIPES, RECIPE_LIST, CHOP_PRESSES, COOK_SECONDS,
  DAY_SECONDS, MAX_ORDERS, orderSpawnInterval, orderPatience, levelForScore,
} from './config.js';

let orderSeq = 0;

export function createRun() {
  return {
    timeLeft: DAY_SECONDS, score: 0, served: 0, combo: 0, bestCombo: 0,
    level: 1, over: false, rush: false,
    orders: [], spawnTimer: 2,
    carrying: null, // { kind: 'raw'|'chopped'|'cooked'|'plate'|'dish', id, items? }
    chop: null, // { item, presses }
    stove: [null, null], // { item, progress } per burner
    plating: { placed: false, items: [], dish: null }, // items: { id, kind }[]
    windowDish: null, // finished plate waiting at the serving window (shot staging)
    lastPayout: 0, lastTip: 0, lastServedName: '',
  };
}

// The state an ingredient must reach before it can go on a plate.
export function readyKind(ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  if (ing.needsChop) return ing.needsCook ? 'cooked' : 'chopped';
  if (ing.needsCook) return 'cooked';
  return 'raw';
}

export function isReadyItem(item) {
  return item && item.kind === readyKind(item.id);
}

export function spawnOrder(run) {
  const recipe = RECIPE_LIST[Math.floor(Math.random() * RECIPE_LIST.length)];
  const maxPatience = orderPatience(run.level);
  run.orders.push({
    id: ++orderSeq, recipeId: recipe.id, name: recipe.name,
    price: recipe.price, patience: maxPatience, maxPatience,
  });
  return run.orders[run.orders.length - 1];
}

export function tickRun(run, dt) {
  if (run.over) return { expired: 0 };
  run.timeLeft -= dt;
  run.level = levelForScore(run.score);
  run.rush = run.timeLeft <= 60 && run.timeLeft > 0;
  run.spawnTimer -= dt;
  if (run.spawnTimer <= 0) {
    if (run.orders.length < MAX_ORDERS) spawnOrder(run);
    run.spawnTimer = orderSpawnInterval(run.level);
  }
  for (const slot of run.stove) {
    if (slot && slot.progress < 1) slot.progress = Math.min(1, slot.progress + dt / COOK_SECONDS);
  }
  let expired = 0;
  run.orders = run.orders.filter((order) => {
    order.patience -= dt;
    if (order.patience <= 0) { expired++; return false; }
    return true;
  });
  if (expired > 0) run.combo = 0;
  if (run.timeLeft <= 0) { run.timeLeft = 0; run.over = true; }
  return { expired };
}

function matchDish(items) {
  const have = items.map((it) => `${it.kind}:${it.id}`).sort().join('|');
  for (const recipe of RECIPE_LIST) {
    const want = recipe.needs.map((id) => `${readyKind(id)}:${id}`).sort().join('|');
    if (have === want) return recipe.id;
  }
  return null;
}

export function describeCarrying(run) {
  const c = run.carrying;
  if (!c) return '';
  if (c.kind === 'plate') return c.items.length ? `Piring (${c.items.length} bahan)` : 'Piring kosong';
  if (c.kind === 'dish') return `${RECIPES[c.id].name} siap!`;
  const ing = INGREDIENTS[c.id];
  if (c.kind === 'raw') return `${ing.name} mentah`;
  if (c.kind === 'chopped') return `${ing.name} cincang`;
  return `${ing.name} matang`;
}

// One interaction at a station. Returns { ok, message, sfx, action }.
// sfx: 'pickup' | 'chop' | 'cook' | 'place' | 'serve' | 'error' | 'trash' | null
export function interact(run, stationId) {
  const fail = (message) => ({ ok: false, message, sfx: 'error' });
  const kind = stationId.startsWith('crate-') ? 'crate'
    : stationId === 'talenan' ? 'board'
    : stationId === 'kompor' ? 'stove'
    : stationId === 'buang' ? 'trash'
    : stationId === 'piring' ? 'plates'
    : stationId === 'buku' ? 'book'
    : stationId === 'piring-saji' ? 'plating'
    : stationId === 'jendela' ? 'serve' : 'none';

  if (kind === 'book') return { ok: true, message: '', sfx: null, action: 'book' };
  if (kind === 'none') return fail('Bukan stasiun.');

  if (kind === 'crate') {
    if (run.carrying) return fail('Tangan penuh!');
    const id = stationId.slice('crate-'.length);
    run.carrying = { kind: 'raw', id };
    return { ok: true, message: `Ambil ${INGREDIENTS[id].name}`, sfx: 'pickup' };
  }

  if (kind === 'trash') {
    if (!run.carrying) return fail('Tidak ada yang dibuang.');
    run.carrying = null;
    run.chop = null;
    return { ok: true, message: 'Dibuang.', sfx: 'trash' };
  }

  if (kind === 'plates') {
    if (run.carrying) return fail('Tangan penuh!');
    run.carrying = { kind: 'plate', items: [] };
    return { ok: true, message: 'Ambil piring', sfx: 'pickup' };
  }

  if (kind === 'board') {
    const c = run.carrying;
    if (!c || c.kind !== 'raw') return fail('Bawa bahan mentah dulu.');
    const ing = INGREDIENTS[c.id];
    if (!ing.needsChop) return fail(`${ing.name} tidak perlu dicincang.`);
    if (!run.chop || run.chop.item !== c.id) run.chop = { item: c.id, presses: 0 };
    run.chop.presses += 1;
    if (run.chop.presses >= CHOP_PRESSES) {
      run.carrying = { kind: 'chopped', id: c.id };
      run.chop = null;
      return { ok: true, message: `${ing.name} selesai dicincang`, sfx: 'chop' };
    }
    return { ok: true, message: `Cincang ${ing.name} ${run.chop.presses}/${CHOP_PRESSES}`, sfx: 'chop' };
  }

  if (kind === 'stove') {
    const c = run.carrying;
    if (c && (c.kind === 'raw' || c.kind === 'chopped')) {
      const ing = INGREDIENTS[c.id];
      const cookable = c.kind === 'chopped' ? ing.needsCook : ing.needsCook;
      if (!cookable) return fail(`${ing.name} tidak perlu dimasak.`);
      const slot = run.stove.findIndex((s) => s === null);
      if (slot === -1) return fail('Kompor penuh!');
      run.stove[slot] = { item: c.id, progress: 0 };
      run.carrying = null;
      return { ok: true, message: `${ing.name} mulai ${ing.cookLabel}`, sfx: 'cook' };
    }
    if (!c) {
      const slot = run.stove.findIndex((s) => s && s.progress >= 1);
      if (slot === -1) return fail('Belum ada yang matang.');
      const item = run.stove[slot].item;
      run.stove[slot] = null;
      run.carrying = { kind: 'cooked', id: item };
      return { ok: true, message: `Ambil ${INGREDIENTS[item].name} matang`, sfx: 'pickup' };
    }
    return fail('Letakkan dulu yang dibawa.');
  }

  if (kind === 'plating') {
    const c = run.carrying;
    if (c && c.kind === 'plate') {
      if (run.plating.placed) return fail('Piring sudah di meja.');
      run.plating = { placed: true, items: [...c.items], dish: null };
      run.carrying = null;
      return { ok: true, message: 'Piring diletakkan', sfx: 'place' };
    }
    if (c && isReadyItem(c)) {
      if (!run.plating.placed) return fail('Letakkan piring dulu.');
      if (run.plating.dish) return fail('Hidangan sudah jadi, angkat dulu.');
      run.plating.items.push({ id: c.id, kind: c.kind });
      run.carrying = null;
      const dish = matchDish(run.plating.items);
      if (dish) {
        run.plating.dish = dish;
        return { ok: true, message: `${RECIPES[dish].name} jadi!`, sfx: 'serve' };
      }
      return { ok: true, message: 'Bahan ditambahkan', sfx: 'place' };
    }
    if (!c && run.plating.dish) {
      const dish = run.plating.dish;
      run.plating = { placed: false, items: [], dish: null };
      run.carrying = { kind: 'dish', id: dish };
      return { ok: true, message: `Angkat ${RECIPES[dish].name}`, sfx: 'pickup' };
    }
    if (!c && run.plating.placed) {
      run.carrying = { kind: 'plate', items: run.plating.items };
      run.plating = { placed: false, items: [], dish: null };
      return { ok: true, message: 'Piring diangkat lagi', sfx: 'pickup' };
    }
    return fail('Bawa bahan matang / piring.');
  }

  if (kind === 'serve') {
    const c = run.carrying;
    if (!c || c.kind !== 'dish') return fail('Bawa hidangan jadi ke sini.');
    const order = run.orders.find((o) => o.recipeId === c.id);
    if (!order) return fail('Tidak ada pesanan ini.');
    const tip = Math.round(order.price * 0.4 * Math.max(0, order.patience / order.maxPatience));
    const payout = order.price + tip;
    run.score += payout;
    run.served += 1;
    run.combo += 1;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    run.lastPayout = payout;
    run.lastTip = tip;
    run.lastServedName = order.name;
    run.orders = run.orders.filter((o) => o.id !== order.id);
    run.carrying = null;
    run.level = levelForScore(run.score);
    return { ok: true, message: `Tersaji! +Rp${payout}`, sfx: 'serve', payout, tip };
  }

  return fail('Bukan stasiun.');
}

// Deterministic staged states for screenshots (?shot=...). Timers frozen by the scene.
export function setupShot(run, mode) {
  run.spawnTimer = 999;
  if (mode === 'cover') {
    run.timeLeft = 92; run.score = 340; run.served = 4; run.combo = 2; run.level = 1;
    run.orders = [
      { id: 1, recipeId: 'nasigoreng', name: 'Nasi Goreng', price: 100, patience: 30, maxPatience: 48 },
      { id: 2, recipeId: 'mieayam', name: 'Mie Ayam', price: 90, patience: 38, maxPatience: 48 },
      { id: 3, recipeId: 'soto', name: 'Soto Senja', price: 110, patience: 18, maxPatience: 48 },
    ];
    run.carrying = { kind: 'raw', id: 'telur' };
    run.plating = {
      placed: true,
      items: [{ id: 'nasi', kind: 'cooked' }, { id: 'ayam', kind: 'cooked' }],
      dish: null,
    };
    run.stove = [{ item: 'ayam', progress: 0.55 }, null];
    run.windowDish = 'mieayam';
    return;
  }
  if (mode === 'chop') {
    run.timeLeft = 105; run.score = 120; run.served = 1; run.combo = 1; run.level = 1;
    run.orders = [
      { id: 1, recipeId: 'mieayam', name: 'Mie Ayam', price: 90, patience: 40, maxPatience: 48 },
    ];
    run.chop = { item: 'ayam', presses: 2 };
    run.carrying = null;
    return;
  }
  if (mode === 'serve') {
    run.timeLeft = 48; run.score = 560; run.served = 6; run.combo = 3; run.level = 2;
    run.orders = [
      { id: 1, recipeId: 'nasigoreng', name: 'Nasi Goreng', price: 100, patience: 25, maxPatience: 48 },
    ];
    run.carrying = { kind: 'dish', id: 'nasigoreng' };
    run.lastPayout = 165; run.lastTip = 65; run.lastServedName = 'Nasi Goreng';
    return;
  }
}
