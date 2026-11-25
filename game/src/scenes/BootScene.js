// BootScene.js — first scene: generate every texture, then hand off.
// No external assets are queued: preload is empty on purpose.
import { generateTextures } from '../textures.js';

const Phaser = window.Phaser;

export default class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    generateTextures(this);
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot && shot !== 'start') {
      this.scene.start('play', { shot });
    } else {
      this.scene.start('title', { shot: shot || null });
    }
  }
}
