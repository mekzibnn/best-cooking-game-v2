// config.js — every tunable number, recipe and station of Dapur Senja.
// Plain module: no Phaser import, so the rules can run under node --test.
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const HUD_HEIGHT = 112;
export const DAY_SECONDS = 120;
export const CHEF_SPEED = 250;
export const INTERACT_RADIUS = 96;
export const CHOP_PRESSES = 3;
export const COOK_SECONDS = 2;
export const MAX_ORDERS = 3;

export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   color: 0xfff6d8, needsChop: false, needsCook: true,  cookLabel: 'dimasak' },
  mie:    { id: 'mie',    name: 'Mie',    color: 0xffd166, needsChop: false, needsCook: true,  cookLabel: 'direbus' },
  ayam:   { id: 'ayam',   name: 'Ayam',   color: 0xf4a261, needsChop: true,  needsCook: true,  cookLabel: 'digoreng' },
  telur:  { id: 'telur',  name: 'Telur',  color: 0xffe066, needsChop: false, needsCook: true,  cookLabel: 'didadar' },
  sayur:  { id: 'sayur',  name: 'Sayur',  color: 0x70c24a, needsChop: true,  needsCook: false, cookLabel: 'diiris' },
  sambal: { id: 'sambal', name: 'Sambal', color: 0xe63946, needsChop: false, needsCook: false, cookLabel: 'siap' },
};

export const RECIPES = {
  nasigoreng: { id: 'nasigoreng', name: 'Nasi Goreng', price: 100, needs: ['nasi', 'telur', 'ayam'], colors: [0xfff6d8, 0xffe066, 0xf4a261] },
  mieayam:    { id: 'mieayam',    name: 'Mie Ayam',    price: 90,  needs: ['mie', 'ayam', 'sayur'], colors: [0xffd166, 0xf4a261, 0x70c24a] },
  soto:       { id: 'soto',       name: 'Soto Senja',  price: 110, needs: ['nasi', 'ayam', 'sayur', 'sambal'], colors: [0xfff6d8, 0xf4a261, 0x70c24a, 0xe63946] },
  telurdadar: { id: 'telurdadar', name: 'Telur Dadar', price: 70,  needs: ['telur', 'sayur'], colors: [0xffe066, 0x70c24a] },
};
export const RECIPE_LIST = Object.values(RECIPES);

// Stations: x, y are the centre of the counter; w/h its body size.
export const STATIONS = [
  { id: 'crate-nasi',    kind: 'crate',  ingredient: 'nasi',   x: 100,  y: 196, w: 92, h: 76 },
  { id: 'crate-mie',     kind: 'crate',  ingredient: 'mie',    x: 206,  y: 196, w: 92, h: 76 },
  { id: 'crate-ayam',    kind: 'crate',  ingredient: 'ayam',   x: 312,  y: 196, w: 92, h: 76 },
  { id: 'crate-telur',   kind: 'crate',  ingredient: 'telur',  x: 418,  y: 196, w: 92, h: 76 },
  { id: 'crate-sayur',   kind: 'crate',  ingredient: 'sayur',  x: 524,  y: 196, w: 92, h: 76 },
  { id: 'crate-sambal',  kind: 'crate',  ingredient: 'sambal', x: 630,  y: 196, w: 92, h: 76 },
  { id: 'talenan',       kind: 'board',  x: 800,  y: 196, w: 150, h: 76 },
  { id: 'kompor',        kind: 'stove',  x: 1050, y: 196, w: 230, h: 76 },
  { id: 'buang',         kind: 'trash',  x: 100,  y: 590, w: 92, h: 76 },
  { id: 'piring',        kind: 'plates', x: 206,  y: 590, w: 92, h: 76 },
  { id: 'buku',          kind: 'book',   x: 312,  y: 590, w: 92, h: 76 },
  { id: 'piring-saji',   kind: 'plating',x: 800,  y: 590, w: 150, h: 76 },
  { id: 'jendela',       kind: 'serve',  x: 1050, y: 590, w: 230, h: 76 },
];

export const STATION_LABELS = {
  'crate-nasi': 'Nasi', 'crate-mie': 'Mie', 'crate-ayam': 'Ayam',
  'crate-telur': 'Telur', 'crate-sayur': 'Sayur', 'crate-sambal': 'Sambal',
  talenan: 'TALENAN', kompor: 'KOMPOR', buang: 'BUANG',
  piring: 'PIRING', buku: 'BUKU RESEP', 'piring-saji': 'PIRING SAJI', jendela: 'JENDELA SAJIAN',
};

export const PALETTE = {
  floor: 0xeed9a4, floorLine: 0xe0c48d, wall: 0x8b5a2b,
  counterTop: 0xb07a45, counterSide: 0x8a5a2e, counterDark: 0x6b4423,
  hudBg: 0x3a2417, hudPanel: 0x5a3a22, cream: '#f6e3c0', gold: '#ffd166',
  teal: 0x2a9d8f, red: 0xe63946, green: 0x70c24a, ink: '#3a2417',
};

export function orderSpawnInterval(level) {
  return Math.max(8, 15 - level);
}
export function orderPatience(level) {
  return Math.max(28, 48 - level * 3);
}
export function levelForScore(score) {
  return 1 + Math.floor(score / 300);
}
