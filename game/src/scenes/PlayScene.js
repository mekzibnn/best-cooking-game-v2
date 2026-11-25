// PlayScene.js — the kitchen: movement (Arcade Physics), stations, cooking.
// Rules live in rules.js; this scene draws the state and sends input actions back.
import { STATIONS, STATION_LABELS, INGREDIENTS, RECIPES, PALETTE, INTERACT_RADIUS, CHEF_SPEED, HUD_HEIGHT } from '../config.js';
import { createRun, tickRun, interact, describeCarrying, setupShot } from '../rules.js';
import { initAudio, playSfx, toggleMute, startMusic } from '../audio.js';

const Phaser = window.Phaser;

const TOP_ROW_Y = 196;
const BOTTOM_ROW_Y = 590;

export default class PlayScene extends Phaser.Scene {
  constructor() { super('play'); }

  init(data) {
    this.run = createRun();
    this.shot = data && data.shot ? data.shot : null;
    this.frozen = !!this.shot;
    if (this.shot) setupShot(this.run, this.shot);
    this.moveTarget = null;
    this.pendingInteract = null;
    this.paused = false;
    this.bookOpen = false;
    this.lastTickSecond = -1;
  }

  create() {
    const W = 1280, H = 720;
    this.add.rectangle(0, HUD_HEIGHT, W, H - HUD_HEIGHT, PALETTE.floor).setOrigin(0);
    for (let x = 0; x <= W; x += 80) this.add.rectangle(x, HUD_HEIGHT, 2, H - HUD_HEIGHT, PALETTE.floorLine).setOrigin(0);
    for (let y = HUD_HEIGHT; y <= H; y += 80) this.add.rectangle(0, y, W, 2, PALETTE.floorLine).setOrigin(0);

    // Counters as static bodies (pre-coloured counter textures) + labels + icons.
    this.counters = this.physics.add.staticGroup();
    this.stationVisuals = {};
    for (const st of STATIONS) {
      const key = st.w > 200 ? 'counter-l' : st.w > 120 ? 'counter-m' : 'counter-s';
      const img = this.counters.create(st.x, st.y, key);
      img.refreshBody();
      const label = this.add.text(st.x, st.y - st.h / 2 + 14, STATION_LABELS[st.id], {
        fontSize: st.w > 120 ? '15px' : '13px', fontStyle: 'bold', color: '#3a2417',
      }).setOrigin(0.5, 0);
      this.stationVisuals[st.id] = { label };
      if (st.kind === 'crate') {
        this.add.image(st.x, st.y + 10, `ing-${st.ingredient}`).setScale(0.85);
      }
    }
    // Stove burners + progress bars.
    this.burners = [];
    const stove = STATIONS.find((s) => s.id === 'kompor');
    [-52, 52].forEach((dx, i) => {
      const img = this.add.image(stove.x + dx, stove.y + 4, 'burner').setScale(0.9);
      const barBg = this.add.rectangle(stove.x + dx, stove.y + 30, 56, 8, 0x3a2417).setOrigin(0.5);
      const bar = this.add.rectangle(stove.x + dx - 26, stove.y + 30, 52, 5, 0xff7b00).setOrigin(0, 0.5);
      bar.setVisible(false); barBg.setVisible(false);
      this.burners.push({ img, bar, barBg, slot: i });
    });
    // Chopping board progress + the ingredient sitting on the board.
    const board = STATIONS.find((s) => s.id === 'talenan');
    this.boardItemImg = this.add.image(board.x, board.y + 4, 'ing-ayam').setScale(0.6).setVisible(false);
    this.chopBarBg = this.add.rectangle(board.x, board.y + 26, 110, 10, 0x3a2417).setOrigin(0.5);
    this.chopBar = this.add.rectangle(board.x - 52, board.y + 26, 104, 6, 0x70c24a).setOrigin(0, 0.5);
    this.chopBar.setVisible(false); this.chopBarBg.setVisible(false);
    // Plating + serving visuals.
    const plating = STATIONS.find((s) => s.id === 'piring-saji');
    this.plateImg = this.add.image(plating.x, plating.y + 12, 'plate').setVisible(false);
    this.plateItems = [];
    this.dishImg = this.add.image(plating.x, plating.y + 12, 'dish-nasigoreng').setVisible(false);
    const window_ = STATIONS.find((s) => s.id === 'jendela');
    this.windowDishImg = this.add.image(window_.x, window_.y + 8, 'dish-mieayam').setVisible(false);
    this.windowLabel = this.add.text(window_.x, window_.y + 28, 'PELANGGAN MENUNGGU', {
      fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    // Staged serve shot: the +Rp popup is part of the scene, not a fading tween.
    if (this.shot === 'serve') {
      this.add.text(1180, 430, '+Rp165', { fontSize: '30px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5);
    }

    // Chef (Arcade body) + carrying icon.
    const startPos = this.shot === 'chop' ? { x: 800, y: 300 }
      : this.shot === 'serve' ? { x: 1050, y: 480 } : { x: 640, y: 430 };
    this.player = this.physics.add.sprite(startPos.x, startPos.y, 'chef');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(36, 48);
    this.physics.add.collider(this.player, this.counters);
    this.carryIcon = this.add.image(startPos.x, startPos.y - 44, 'ing-telur').setVisible(false);
    this.carryLabel = this.add.text(startPos.x, startPos.y - 66, '', {
      fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#3a2417', padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setVisible(false);

    // Prompt line + recipe book overlay + pause overlay.
    this.promptText = this.add.text(640, 688, '', {
      fontSize: '18px', fontStyle: 'bold', color: '#3a2417', backgroundColor: '#fff6d8',
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5);
    this.buildBook();
    this.pauseOverlay = this.add.container(640, 360).setVisible(false);
    const pauseBg = this.add.rectangle(0, 0, 420, 150, 0xfff6d8).setStrokeStyle(4, 0xe76f51);
    const pauseText = this.add.text(0, -18, 'JEDA', { fontSize: '40px', fontStyle: 'bold', color: '#e76f51' }).setOrigin(0.5);
    const pauseHint = this.add.text(0, 34, 'Tekan P untuk lanjut', { fontSize: '18px', color: '#3a2417' }).setOrigin(0.5);
    this.pauseOverlay.add([pauseBg, pauseText, pauseHint]);

    // Input: keyboard + mouse.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.on('keydown-E', () => this.tryInteract());
    this.input.keyboard.on('keydown-SPACE', () => this.tryInteract());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => { initAudio(); toggleMute(); });
    this.input.keyboard.on('keydown-H', () => this.toggleBook());
    this.input.on('pointerdown', (pointer) => {
      initAudio(); startMusic();
      const station = this.stationAt(pointer.worldX, pointer.worldY);
      if (station) {
        const approachY = station.y < 400 ? station.y + 80 : station.y - 80;
        this.moveTarget = { x: station.x, y: approachY };
        this.pendingInteract = station.id;
      } else {
        this.moveTarget = { x: pointer.worldX, y: pointer.worldY };
        this.pendingInteract = null;
      }
    });
    this.input.keyboard.on('keydown', () => { initAudio(); startMusic(); });

    this.registry.set('run', this.run);
    if (!this.scene.isActive('hud')) this.scene.launch('hud');
    this.refreshVisuals();
  }

  buildBook() {
    const lines = ['BUKU RESEP — tekan H untuk tutup'];
    for (const recipe of Object.values(RECIPES)) {
      const needs = recipe.needs.map((id) => INGREDIENTS[id].name).join(' + ');
      lines.push(`${recipe.name} — Rp${recipe.price}: ${needs}`);
    }
    lines.push('Ayam & Sayur: cincang di Talenan (E 3x).');
    lines.push('Nasi, Mie, Telur, Ayam cincang: masak di Kompor (~2 dtk).');
    this.bookOverlay = this.add.container(640, 360).setVisible(false);
    const bg = this.add.rectangle(0, 0, 560, 300, 0xfff6d8).setStrokeStyle(4, 0x2a9d8f);
    const text = this.add.text(0, 0, lines.join('\n'), {
      fontSize: '19px', color: '#3a2417', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5);
    this.bookOverlay.add([bg, text]);
  }

  stationAt(x, y) {
    for (const st of STATIONS) {
      if (Math.abs(x - st.x) <= st.w / 2 + 8 && Math.abs(y - st.y) <= st.h / 2 + 8) return st;
    }
    return null;
  }

  nearestStation() {
    let best = null, bestDist = INTERACT_RADIUS;
    for (const st of STATIONS) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, st.x, st.y);
      if (d < bestDist) { best = st; bestDist = d; }
    }
    return best;
  }

  tryInteract() {
    if (this.paused || this.run.over) return;
    const st = this.nearestStation();
    if (!st) return;
    this.doInteract(st.id);
  }

  doInteract(stationId) {
    const result = interact(this.run, stationId);
    if (result.action === 'book') { this.toggleBook(); return; }
    playSfx(result.sfx || 'click');
    if (!result.ok) {
      this.cameras.main.shake(120, 0.004);
      this.showFloat(this.player.x, this.player.y - 70, result.message, '#e63946');
    } else if (result.payout) {
      this.showFloat(1050, 520, `+Rp${result.payout}`, '#ffd166');
      this.burst(1050, 560);
      this.tweens.add({ targets: this.player, scaleX: 1.15, scaleY: 1.15, duration: 120, yoyo: true });
    }
    this.refreshVisuals();
  }

  burst(x, y) {
    try {
      const emitter = this.add.particles(x, y, 'spark', {
        speed: { min: 60, max: 180 }, lifespan: 600, quantity: 12, scale: { start: 1, end: 0 },
      });
      emitter.explode(12, x, y);
      this.time.delayedCall(700, () => emitter.destroy());
    } catch (e) { /* particles optional */ }
  }

  showFloat(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontSize: '22px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  togglePause() {
    if (this.run.over) return;
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    playSfx('click');
  }

  toggleBook() {
    this.bookOpen = !this.bookOpen;
    this.bookOverlay.setVisible(this.bookOpen);
    playSfx('click');
  }

  refreshVisuals() {
    const run = this.run;
    // Stove burners.
    this.burners.forEach((b) => {
      const slot = run.stove[b.slot];
      b.img.setTexture(slot && slot.progress >= 1 ? 'burner-hot' : 'burner');
      const show = !!slot;
      b.bar.setVisible(show); b.barBg.setVisible(show);
      if (show) b.bar.width = 52 * slot.progress;
    });
    // Chopping progress.
    const chopping = !!run.chop;
    this.chopBar.setVisible(chopping); this.chopBarBg.setVisible(chopping);
    if (chopping) {
      this.chopBar.width = 104 * (run.chop.presses / 3);
      this.boardItemImg.setTexture(`ing-${run.chop.item}`).setVisible(true);
    } else {
      this.boardItemImg.setVisible(false);
    }
    // Plating counter.
    this.plateImg.setVisible(run.plating.placed && !run.plating.dish);
    this.dishImg.setVisible(!!run.plating.dish);
    if (run.plating.dish) this.dishImg.setTexture(`dish-${run.plating.dish}`);
    for (const img of this.plateItems) img.destroy();
    this.plateItems = [];
    if (run.plating.placed && !run.plating.dish) {
      run.plating.items.forEach((it, i) => {
        this.plateItems.push(this.add.image(800 - 30 + i * 30, 596, `ing-${it.id}`).setScale(0.55));
      });
    }
    // Serving window.
    this.windowDishImg.setVisible(!!run.windowDish);
    if (run.windowDish) this.windowDishImg.setTexture(`dish-${run.windowDish}`);
    this.windowLabel.setText(run.windowDish ? 'PESANAN SIAP!' : 'PELANGGAN MENUNGGU');
    // Carrying icon + label above the chef.
    const c = run.carrying;
    this.carryIcon.setVisible(!!c);
    this.carryLabel.setVisible(!!c);
    if (c) {
      const key = c.kind === 'plate' ? 'plate' : c.kind === 'dish' ? `dish-${c.id}` : `ing-${c.id}`;
      this.carryIcon.setTexture(key);
      this.carryLabel.setText(describeCarrying(run));
    }
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    if (this.paused) { this.player.body.setVelocity(0); return; }
    if (!this.frozen && !this.run.over) {
      const before = Math.ceil(this.run.timeLeft);
      tickRun(this.run, dt);
      const after = Math.ceil(this.run.timeLeft);
      if (after !== before && after <= 20 && after > 0) playSfx('tick');
      if (this.run.over) {
        try { localStorage.setItem('dapur-senja-best', String(Math.max(this.run.score, Number(localStorage.getItem('dapur-senja-best') || 0)))); } catch (e) {}
        this.scene.stop('hud');
        this.scene.start('gameover', { score: this.run.score, served: this.run.served, bestCombo: this.run.bestCombo });
        return;
      }
    }

    // Movement: keyboard wins; otherwise click-to-move target.
    const body = this.player.body;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    if (vx !== 0 || vy !== 0) {
      this.moveTarget = null; this.pendingInteract = null;
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * CHEF_SPEED, (vy / len) * CHEF_SPEED);
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 14) {
        body.setVelocity(0);
        const target = this.pendingInteract;
        this.moveTarget = null; this.pendingInteract = null;
        if (target) this.doInteract(target);
      } else {
        body.setVelocity((dx / dist) * CHEF_SPEED, (dy / dist) * CHEF_SPEED);
      }
    } else {
      body.setVelocity(0);
    }

    // Carrying icon follows the chef; prompt shows the nearest station.
    this.carryIcon.setPosition(this.player.x, this.player.y - 44);
    this.carryLabel.setPosition(this.player.x, this.player.y - 68);
    const near = this.nearestStation();
    if (near && !this.run.over) {
      const hint = near.kind === 'crate' ? `E: Ambil ${INGREDIENTS[near.ingredient].name}`
        : near.kind === 'board' ? 'E: Cincang (3x)'
        : near.kind === 'stove' ? 'E: Masak / ambil matang'
        : near.kind === 'plating' ? 'E: Rakit / angkat hidangan'
        : near.kind === 'serve' ? 'E: Sajikan!'
        : near.kind === 'plates' ? 'E: Ambil piring'
        : near.kind === 'trash' ? 'E: Buang'
        : near.kind === 'book' ? 'E: Buka buku resep'
        : '';
      this.promptText.setText(hint);
      this.promptText.setVisible(hint !== '');
    } else {
      this.promptText.setText('');
      this.promptText.setVisible(false);
    }

    // Stove visuals animate with progress even without interaction.
    this.burners.forEach((b) => {
      const slot = this.run.stove[b.slot];
      if (slot) {
        b.img.setTexture(slot.progress >= 1 ? 'burner-hot' : 'burner');
        b.bar.setVisible(true); b.barBg.setVisible(true);
        b.bar.width = 52 * slot.progress;
      } else {
        b.bar.setVisible(false); b.barBg.setVisible(false);
      }
    });
  }
}
