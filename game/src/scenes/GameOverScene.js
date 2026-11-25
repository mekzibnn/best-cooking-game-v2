// GameOverScene.js — end of day: score, served, best combo, restart or title.

const Phaser = window.Phaser;

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('gameover'); }

  init(data) {
    this.score = data.score || 0;
    this.served = data.served || 0;
    this.bestCombo = data.bestCombo || 0;
  }

  create() {
    let best = 0;
    try { best = Number(window.localStorage.getItem('dapur-senja-best') || 0) || 0; } catch (e) {}
    this.add.rectangle(0, 0, 1280, 720, 0x2b1d12, 0.72).setOrigin(0);
    this.add.rectangle(640, 360, 620, 440, 0xfff6d8).setStrokeStyle(6, 0xe76f51);
    this.add.text(640, 190, 'HARI SELESAI!', { fontSize: '52px', fontStyle: 'bold', color: '#e76f51' }).setOrigin(0.5);
    this.add.text(640, 250, 'Warung tutup — pelanggan pulang kenyang.', { fontSize: '19px', color: '#6b4423' }).setOrigin(0.5);
    this.add.text(640, 310, `Skor akhir: ${this.score}`, { fontSize: '30px', fontStyle: 'bold', color: '#3a2417' }).setOrigin(0.5);
    this.add.text(640, 352, `Hidangan disajikan: ${this.served}   •   Kombo terbaik: x${this.bestCombo}`, {
      fontSize: '20px', color: '#3a2417',
    }).setOrigin(0.5);
    this.add.text(640, 392, `Skor terbaik tersimpan: ${best}`, { fontSize: '18px', color: '#2a9d8f' }).setOrigin(0.5);

    const btn = this.add.rectangle(640, 470, 320, 60, 0x2a9d8f).setInteractive({ useHandCursor: true });
    this.add.text(640, 470, 'MASAK LAGI (R)', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    const btn2 = this.add.rectangle(640, 548, 320, 48, 0xb07a45).setInteractive({ useHandCursor: true });
    this.add.text(640, 548, 'Kembali ke Judul (T)', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);

    const again = () => { this.scene.start('play', {}); };
    const title = () => { this.scene.start('title', {}); };
    btn.on('pointerdown', again);
    btn2.on('pointerdown', title);
    this.input.keyboard.on('keydown-R', again);
    this.input.keyboard.on('keydown-T', title);
    this.input.keyboard.on('keydown-ENTER', again);
  }
}
