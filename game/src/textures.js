// textures.js — every sprite in Dapur Senja is drawn procedurally here in BootScene.
// No image files are loaded: each texture is a Phaser Graphics drawing turned
// into a texture with generateTexture, so the game ships zero external assets.
import { INGREDIENTS, RECIPES } from './config.js';

function drawIngredient(g, id) {
  if (id === 'nasi') {
    g.fillStyle(0x3b6ea5, 1).fillEllipse(24, 30, 40, 20); // bowl
    g.fillStyle(0xfff6d8, 1).fillEllipse(24, 24, 34, 14); // rice
    g.fillStyle(0xe8d9a0, 1);
    g.fillCircle(16, 22, 2); g.fillCircle(24, 20, 2); g.fillCircle(32, 23, 2);
  } else if (id === 'mie') {
    g.lineStyle(5, 0xffd166, 1);
    g.beginPath(); g.moveTo(6, 16); g.lineTo(16, 12); g.lineTo(26, 17); g.lineTo(36, 12); g.lineTo(42, 16); g.strokePath();
    g.beginPath(); g.moveTo(6, 26); g.lineTo(16, 22); g.lineTo(26, 27); g.lineTo(36, 22); g.lineTo(42, 26); g.strokePath();
    g.beginPath(); g.moveTo(6, 36); g.lineTo(16, 32); g.lineTo(26, 37); g.lineTo(36, 32); g.lineTo(42, 36); g.strokePath();
  } else if (id === 'ayam') {
    g.fillStyle(0xf4a261, 1).fillCircle(20, 24, 13); // drumstick meat
    g.fillStyle(0xfff6d8, 1).fillRect(30, 26, 12, 5); // bone
    g.fillCircle(42, 24, 4); g.fillCircle(42, 32, 4);
    g.fillStyle(0xd97b3f, 1).fillCircle(16, 20, 4);
  } else if (id === 'telur') {
    g.fillStyle(0xffffff, 1).fillEllipse(24, 24, 34, 26);
    g.fillStyle(0xffe066, 1).fillCircle(24, 25, 9);
    g.fillStyle(0xf2c14e, 1).fillCircle(22, 23, 3);
  } else if (id === 'sayur') {
    g.fillStyle(0x70c24a, 1).fillEllipse(24, 24, 30, 20);
    g.fillStyle(0x4a8c2f, 1).fillEllipse(24, 24, 22, 12);
    g.lineStyle(3, 0x4a8c2f, 1);
    g.beginPath(); g.moveTo(24, 14); g.lineTo(24, 34); g.strokePath();
    g.fillStyle(0x8fd66a, 1).fillCircle(18, 20, 3); g.fillCircle(30, 28, 3);
  } else if (id === 'sambal') {
    g.fillStyle(0xe63946, 1).fillEllipse(24, 26, 34, 14);
    g.fillStyle(0xc1121f, 1).fillEllipse(24, 28, 26, 8);
    g.fillStyle(0x4a8c2f, 1).fillRect(36, 12, 5, 8);
    g.fillStyle(0xffe066, 1).fillCircle(16, 24, 2); g.fillCircle(28, 26, 2);
  }
}

export function generateTextures(scene) {
  // Chef: 44x56 — white hat, face, teal apron.
  let g = scene.add.graphics();
  g.fillStyle(0xffffff, 1).fillEllipse(22, 10, 34, 16);
  g.fillStyle(0xe8e8e8, 1).fillRect(8, 16, 28, 6);
  g.fillStyle(0xffd9b3, 1).fillCircle(22, 28, 11);
  g.fillStyle(0x2a2a2a, 1).fillCircle(18, 27, 2); g.fillCircle(26, 27, 2);
  g.fillStyle(0x2a9d8f, 1).fillRoundedRect(10, 38, 24, 18, 5);
  g.fillStyle(0xffffff, 1).fillRect(18, 40, 8, 12);
  g.generateTexture('chef', 44, 56);
  g.destroy();

  // Ingredient icons, 48x48 each.
  for (const id of Object.keys(INGREDIENTS)) {
    g = scene.add.graphics();
    drawIngredient(g, id);
    g.generateTexture(`ing-${id}`, 48, 48);
    g.destroy();
  }

  // Plate: white ellipse with a grey rim.
  g = scene.add.graphics();
  g.fillStyle(0xd8d8d8, 1).fillEllipse(40, 20, 78, 38);
  g.fillStyle(0xffffff, 1).fillEllipse(40, 19, 70, 32);
  g.generateTexture('plate', 80, 40);
  g.destroy();

  // One finished-dish texture per recipe: plate + its ingredient colours.
  for (const recipe of Object.values(RECIPES)) {
    g = scene.add.graphics();
    g.fillStyle(0xd8d8d8, 1).fillEllipse(40, 22, 78, 38);
    g.fillStyle(0xffffff, 1).fillEllipse(40, 21, 70, 32);
    recipe.colors.forEach((color, i) => {
      g.fillStyle(color, 1).fillCircle(22 + i * 13, 20 - (i % 2) * 4, 8);
    });
    g.generateTexture(`dish-${recipe.id}`, 80, 42);
    g.destroy();
  }

  // Burner rings.
  g = scene.add.graphics();
  g.fillStyle(0x3a3a3a, 1).fillCircle(28, 28, 26);
  g.fillStyle(0x1d1d1d, 1).fillCircle(28, 28, 18);
  g.generateTexture('burner', 56, 56);
  g.destroy();
  g = scene.add.graphics();
  g.fillStyle(0xff7b00, 1).fillCircle(28, 28, 26);
  g.fillStyle(0xffd166, 1).fillCircle(28, 28, 18);
  g.fillStyle(0xff9b00, 1).fillCircle(28, 28, 10);
  g.generateTexture('burner-hot', 56, 56);
  g.destroy();

  // Counter bodies in three widths: brown top, dark edge — no tint needed.
  for (const [key, w] of [['counter-s', 92], ['counter-m', 150], ['counter-l', 230]]) {
    g = scene.add.graphics();
    g.fillStyle(0xb07a45, 1).fillRect(0, 0, w, 76);
    g.fillStyle(0xd09a5f, 1).fillRect(0, 0, w, 10);
    g.fillStyle(0x8a5a2e, 1).fillRect(0, 70, w, 6);
    g.generateTexture(key, w, 76);
    g.destroy();
  }

  // Ticket background (white card) and a spark for serve particles.
  g = scene.add.graphics();
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 200, 64);
  g.generateTexture('ticket', 200, 64);
  g.destroy();
  g = scene.add.graphics();
  g.fillStyle(0xffd166, 1);
  g.fillPoints([
    { x: 10, y: 0 }, { x: 13, y: 7 }, { x: 20, y: 10 }, { x: 13, y: 13 },
    { x: 10, y: 20 }, { x: 7, y: 13 }, { x: 0, y: 10 }, { x: 7, y: 7 },
  ], true);
  g.generateTexture('spark', 20, 20);
  g.destroy();
}
