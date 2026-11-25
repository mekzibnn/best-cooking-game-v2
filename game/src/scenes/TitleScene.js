// TitleScene.js — the title screen over a dimmed kitchen backdrop.
// Enter / click starts the run; shot=start renders this scene for screenshots.
import { initAudio, playSfx, startMusic } from '../audio.js';

const Phaser = window.Phaser;

export default class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  init(data) {
    this.shot = data && data.shot ? data.shot : null;
  }

  create() {
    const W = 1280, H = 720;
    // Dimmed kitchen backdrop: floor, counter rows, crates.
    this.add.rectangle(0, 0, W, H, 0xeed9a4).setOrigin(0);
    for (let x = 0; x < W; x += 80) {
      this.add.rectangle(x, 112, 80, 2, 0xe0c48d).setOrigin(0);
    }
    const crateX = [100, 206, 312, 418, 524, 630];
    const ingKeys = ['ing-nasi', 'ing-mie', 'ing-ayam', 'ing-telur', 'ing-sayur', 'ing-sambal'];
    crateX.forEach((x, i) => {
      this.add.rectangle(x, 196, 92, 76, 0xb07a45).setStrokeStyle(3, 0x6b4423);
      this.add.image(x, 188, ingKeys[i]).setScale(0.8);
      this.add.rectangle(x, 590, 92, 76, 0xb07a45).setStrokeStyle(3, 0x6b4423);
    });
    this.add.rectangle(0, 0, W, H, 0x2b1d12, 0.45).setOrigin(0);

    // Title panel.
    const panel = this.add.rectangle(640, 360, 800, 440, 0xfff6d8).setStrokeStyle(6, 0xe76f51);
    panel.setInteractive();
    this.add.text(640, 205, 'DAPUR SENJA', { fontSize: '60px', fontStyle: 'bold', color: '#e76f51' }).setOrigin(0.5);
    this.add.text(640, 262, 'Warung Cepat Saji', { fontSize: '28px', fontStyle: 'bold', color: '#2a9d8f' }).setOrigin(0.5);
    this.add.text(640, 322,
      'Masak, rakit, dan sajikan pesanan sebelum pelanggan kehabisan sabar!\nAmbil bahan → cincang / masak → rakit di piring → antar ke jendela.',
      { fontSize: '18px', color: '#3a2417', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    this.add.text(640, 398,
      'Gerak: WASD / panah  •  Interaksi: E / Spasi / klik  •  P: jeda  •  H: resep  •  M: suara\n4 resep: Nasi Goreng, Mie Ayam, Soto Senja, Telur Dadar',
      { fontSize: '16px', color: '#6b4423', align: 'center', lineSpacing: 6 }).setOrigin(0.5);

    const btn = this.add.rectangle(640, 486, 320, 64, 0x2a9d8f).setInteractive({ useHandCursor: true });
    this.add.text(640, 486, 'MULAI MASAK ▶', { fontSize: '28px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(640, 546, 'atau tekan Enter', { fontSize: '16px', color: '#6b4423' }).setOrigin(0.5);
    this.add.text(640, 566, 'Game masak orisinal — dimainkan offline di browser, keyboard + mouse.',
      { fontSize: '15px', color: '#8a5a2e' }).setOrigin(0.5);

    const start = () => {
      initAudio(); playSfx('click'); startMusic();
      this.scene.start('play', {});
    };
    btn.on('pointerdown', start);
    this.input.keyboard.on('keydown-ENTER', start);
    this.input.keyboard.on('keydown-SPACE', start);
  }
}
