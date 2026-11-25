// HudScene.js — parallel HUD: order board, day timer, score, combo, RUSH banner.
// Reads the run object from the registry every frame; the PlayScene owns the state.
import { RECIPES, PALETTE, HUD_HEIGHT } from '../config.js';

const Phaser = window.Phaser;

export default class HudScene extends Phaser.Scene {
  constructor() { super('hud'); }

  create() {
    this.add.rectangle(0, 0, 1280, HUD_HEIGHT, PALETTE.hudBg).setOrigin(0);
    this.add.rectangle(0, HUD_HEIGHT - 4, 1280, 4, 0x8a5a2e).setOrigin(0);

    // Order board (left).
    this.add.text(24, 12, 'PAPAN PESANAN', { fontSize: '17px', fontStyle: 'bold', color: '#ffd166' });
    this.add.text(24, 34, 'Sajikan sebelum kesabaran habis!', { fontSize: '13px', color: '#e8cfa8' });
    this.tickets = [];
    for (let i = 0; i < 3; i++) {
      const x = 24 + i * 218;
      const bg = this.add.image(x, 56, 'ticket').setOrigin(0, 0).setDisplaySize(206, 48);
      const name = this.add.text(x + 10, 62, '', { fontSize: '15px', fontStyle: 'bold', color: '#3a2417' });
      const sub = this.add.text(x + 10, 82, '', { fontSize: '12px', color: '#6b4423' });
      const barBg = this.add.rectangle(x + 10, 100, 120, 6, 0xd8d8d8).setOrigin(0, 0.5);
      const bar = this.add.rectangle(x + 10, 100, 120, 6, 0x70c24a).setOrigin(0, 0.5);
      const group = { bg, name, sub, barBg, bar };
      Object.values(group).forEach((o) => o.setVisible(false));
      this.tickets.push(group);
    }

    // Right panel: title, timer, score.
    this.add.rectangle(700, 8, 556, 96, PALETTE.hudPanel).setOrigin(0);
    this.add.text(716, 16, 'DAPUR SENJA', { fontSize: '20px', fontStyle: 'bold', color: '#ffd166' });
    this.levelText = this.add.text(716, 42, 'Level 1 • Warung Cepat Saji', { fontSize: '14px', color: '#e8cfa8' });
    this.timerText = this.add.text(1236, 14, '2:00', { fontSize: '34px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0);
    this.scoreText = this.add.text(716, 66, 'Skor 0', { fontSize: '17px', fontStyle: 'bold', color: '#ffffff' });
    this.servedText = this.add.text(900, 66, 'Disajikan 0', { fontSize: '17px', color: '#e8cfa8' });
    this.comboText = this.add.text(1060, 66, '', { fontSize: '17px', fontStyle: 'bold', color: '#ffd166' });
    this.rushText = this.add.text(640, 116, '⚡ RUSH — pelanggan makin tidak sabar! ⚡', {
      fontSize: '20px', fontStyle: 'bold', color: '#e63946', backgroundColor: '#fff6d8', padding: { x: 10, y: 4 },
    }).setOrigin(0.5, 0).setVisible(false);

    this.events.once('shutdown', () => {
      this.registry.events.off('changedata-score');
    });
  }

  update() {
    const run = this.registry.get('run');
    if (!run) return;
    const mins = Math.floor(run.timeLeft / 60);
    const secs = Math.floor(run.timeLeft % 60).toString().padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);
    this.timerText.setColor(run.timeLeft <= 20 ? '#ff6b6b' : '#ffffff');
    this.levelText.setText(`Level ${run.level} • Warung Cepat Saji`);
    this.scoreText.setText(`Skor ${run.score}`);
    this.servedText.setText(`Disajikan ${run.served}`);
    this.comboText.setText(run.combo >= 2 ? `Kombo x${run.combo}` : '');
    this.rushText.setVisible(!!run.rush);

    run.orders.forEach((order, i) => {
      const t = this.tickets[i];
      if (!t) return;
      Object.values(t).forEach((o) => o.setVisible(true));
      const recipe = RECIPES[order.recipeId];
      t.name.setText(order.name);
      t.sub.setText(`Rp${order.price} • tip Rp${Math.round(order.price * 0.4 * Math.max(0, order.patience / order.maxPatience))}`);
      const frac = Math.max(0, order.patience / order.maxPatience);
      t.bar.width = 120 * frac;
      t.bar.setFillStyle(frac > 0.5 ? 0x70c24a : frac > 0.25 ? 0xffd166 : 0xe63946);
      t.bg.setTint(recipe.colors[0]);
    });
    for (let i = run.orders.length; i < 3; i++) {
      Object.values(this.tickets[i]).forEach((o) => o.setVisible(false));
    }
  }
}
