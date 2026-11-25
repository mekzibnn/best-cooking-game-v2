// main.js — one Phaser.Game for Dapur Senja (Phaser 4.2.1, vendored as a
// classic script in index.html, so the engine arrives as window.Phaser).
// Scenes are listed in draw order: later scenes draw on top of earlier ones.
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import PlayScene from './scenes/PlayScene.js';
import HudScene from './scenes/HudScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const Phaser = window.Phaser;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#f6e3c0',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, TitleScene, PlayScene, HudScene, GameOverScene],
};

const game = new Phaser.Game(config);
window.game = game;
export default game;
