(function (global) {
  'use strict';

  const ENTITY_PRESETS = {
    player: {
      name: 'Player',
      width: 34,
      height: 48,
      color: '#ff6a1a',
      isStatic: false,
      hasGravity: true,
      speed: 290,
      jumpForce: 580,
      velocity: { x: 0, y: 0 },
    },
    platform: {
      name: 'Platform',
      width: 160,
      height: 32,
      color: '#334155',
      isStatic: true,
      hasGravity: false,
      speed: 0,
      jumpForce: 0,
      velocity: { x: 0, y: 0 },
    },
    enemy: {
      name: 'Enemy',
      width: 34,
      height: 34,
      color: '#ef4444',
      isStatic: false,
      hasGravity: true,
      speed: 120,
      jumpForce: 0,
      velocity: { x: 120, y: 0 },
    },
    coin: {
      name: 'Coin',
      width: 24,
      height: 24,
      color: '#facc15',
      isStatic: true,
      hasGravity: false,
      speed: 0,
      jumpForce: 0,
      velocity: { x: 0, y: 0 },
    },
    trigger: {
      name: 'FinishTrigger',
      width: 44,
      height: 76,
      color: '#22c55e',
      isStatic: true,
      hasGravity: false,
      speed: 0,
      jumpForce: 0,
      velocity: { x: 0, y: 0 },
    },
  };

  function createEntity(type, x, y, overrides) {
    const preset = ENTITY_PRESETS[type] || ENTITY_PRESETS.platform;
    const id = 'ent_' + Math.random().toString(36).slice(2, 8);
    const base = {
      id: id,
      name: preset.name,
      type: type,
      x: Math.round(x),
      y: Math.round(y),
      width: preset.width,
      height: preset.height,
      color: preset.color,
      isStatic: preset.isStatic,
      hasGravity: preset.hasGravity,
      speed: preset.speed,
      jumpForce: preset.jumpForce,
      velocity: { x: preset.velocity.x, y: preset.velocity.y },
      removed: false,
      onGround: false,
    };
    if (overrides && typeof overrides === 'object') {
      for (const k in overrides) {
        if (k === 'velocity' && overrides.velocity) {
          base.velocity = {
            x: Number(overrides.velocity.x) || 0,
            y: Number(overrides.velocity.y) || 0,
          };
        } else if (overrides[k] !== undefined) {
          base[k] = overrides[k];
        }
      }
    }
    return base;
  }

  function cloneScene(scene) {
    return {
      name: scene.name || 'Level 1',
      gravity: typeof scene.gravity === 'number' ? scene.gravity : 1450,
      cameraLerp: typeof scene.cameraLerp === 'number' ? scene.cameraLerp : 0.12,
      entities: (scene.entities || []).map(function (e) {
        return {
          id: String(e.id),
          name: String(e.name || e.type),
          type: e.type,
          x: Number(e.x) || 0,
          y: Number(e.y) || 0,
          width: Math.max(8, Number(e.width) || 32),
          height: Math.max(8, Number(e.height) || 32),
          color: String(e.color || '#ffffff'),
          isStatic: Boolean(e.isStatic),
          hasGravity: Boolean(e.hasGravity),
          speed: Number(e.speed) || 0,
          jumpForce: Number(e.jumpForce) || 0,
          velocity: {
            x: Number(e.velocity && e.velocity.x) || 0,
            y: Number(e.velocity && e.velocity.y) || 0,
          },
          removed: Boolean(e.removed),
          onGround: Boolean(e.onGround),
        };
      }),
    };
  }

  function createDefaultScene() {
    return {
      name: 'Test Stunt Level',
      gravity: 1450,
      cameraLerp: 0.12,
      entities: [
        createEntity('platform', -64, 464, {
          id: 'ground_start',
          name: 'Start Ground',
          width: 480,
          height: 64,
          color: '#334155',
        }),
        createEntity('platform', -64, 240, {
          id: 'wall_left',
          name: 'Left Wall',
          width: 32,
          height: 224,
          color: '#475569',
        }),
        createEntity('platform', 208, 368, {
          id: 'step_1',
          name: 'Step 1',
          width: 144,
          height: 28,
          color: '#475569',
        }),
        createEntity('platform', 480, 320, {
          id: 'bridge_mid',
          name: 'Mid Platform',
          width: 240,
          height: 32,
          color: '#3b495e',
        }),
        createEntity('platform', 784, 416, {
          id: 'ground_right',
          name: 'Arena Floor',
          width: 464,
          height: 64,
          color: '#334155',
        }),
        createEntity('platform', 1216, 208, {
          id: 'wall_right',
          name: 'Right Wall',
          width: 32,
          height: 208,
          color: '#475569',
        }),
        createEntity('platform', 976, 272, {
          id: 'goal_ledge',
          name: 'Goal Ledge',
          width: 192,
          height: 28,
          color: '#3b495e',
        }),
        createEntity('player', 64, 384, {
          id: 'player_main',
          name: 'Rider Hero',
        }),
        createEntity('coin', 268, 324, { id: 'coin_1', name: 'Coin 1' }),
        createEntity('coin', 560, 272, { id: 'coin_2', name: 'Coin 2' }),
        createEntity('coin', 624, 272, { id: 'coin_3', name: 'Coin 3' }),
        createEntity('coin', 896, 368, { id: 'coin_4', name: 'Coin 4' }),
        createEntity('coin', 1024, 224, { id: 'coin_5', name: 'Coin 5' }),
        createEntity('enemy', 880, 368, {
          id: 'enemy_1',
          name: 'Patrol Bot',
          speed: 120,
          velocity: { x: 120, y: 0 },
        }),
        createEntity('trigger', 1104, 196, {
          id: 'goal_portal',
          name: 'Finish Portal',
        }),
      ],
    };
  }

  class Engine2D {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = options || {};
      this.scene = createDefaultScene();
      this.mode = 'edit'; // 'edit' | 'play'
      this.camera = { x: -120, y: -40 };
      this.time = 0;
      this.lastFrameTime = 0;
      this.accumulator = 0;
      this.fixedDt = 1 / 60;
      this.rafId = null;

      this.playState = {
        coinsCollected: 0,
        totalCoins: 0,
        won: false,
        lost: false,
        facing: 1,
      };

      this.input = {
        left: false,
        right: false,
        jump: false,
      };

      this._onBeforeRender = null;
      this._onPlayStats = null;
      this._onToast = null;

      this._bindKeyboard();
    }

    _bindKeyboard() {
      this._handleKeyDown = (e) => {
        if (this.mode !== 'play') return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.input.left = true;
          this.playState.facing = -1;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.input.right = true;
          this.playState.facing = 1;
        } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          this.input.jump = true;
        }
      };

      this._handleKeyUp = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.input.left = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.input.right = false;
        } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          this.input.jump = false;
        }
      };

      window.addEventListener('keydown', this._handleKeyDown);
      window.addEventListener('keyup', this._handleKeyUp);
    }

    setInputState(key, active) {
      if (key === 'left') {
        this.input.left = active;
        if (active) this.playState.facing = -1;
      } else if (key === 'right') {
        this.input.right = active;
        if (active) this.playState.facing = 1;
      } else if (key === 'jump') {
        this.input.jump = active;
      }
    }

    resetInputs() {
      this.input.left = false;
      this.input.right = false;
      this.input.jump = false;
    }

    resize() {
      const rect = this.canvas.parentElement
        ? this.canvas.parentElement.getBoundingClientRect()
        : this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(180, Math.floor(rect.height));
      if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
      }
      this.viewW = w;
      this.viewH = h;
      this.dpr = dpr;
    }

    findPlayer() {
      for (let i = 0; i < this.scene.entities.length; i++) {
        const e = this.scene.entities[i];
        if (!e.removed && e.type === 'player') return e;
      }
      return null;
    }

    centerCameraOnPlayer(immediate) {
      const player = this.findPlayer();
      if (!player || !this.viewW) return;
      const targetX = player.x + player.width * 0.5 - this.viewW * 0.5;
      const targetY = player.y + player.height * 0.5 - this.viewH * 0.55;
      if (immediate) {
        this.camera.x = targetX;
        this.camera.y = targetY;
      } else {
        // FPS-independent lerp factor calibrated to 60Hz
        const lerpAmt = Math.min(1, Math.max(0.01, Number(this.scene.cameraLerp) || 0.12));
        this.camera.x += (targetX - this.camera.x) * lerpAmt;
        this.camera.y += (targetY - this.camera.y) * lerpAmt;
      }
    }

    startPlay() {
      this.mode = 'play';
      this.resetInputs();
      const coins = this.scene.entities.filter(function (e) {
        return e.type === 'coin' && !e.removed;
      }).length;
      this.playState = {
        coinsCollected: 0,
        totalCoins: coins,
        won: false,
        lost: false,
        facing: 1,
      };
      this.centerCameraOnPlayer(true);
      this.accumulator = 0;
      if (this._onPlayStats) this._onPlayStats(this.playState);
    }

    stopPlay(restoredScene) {
      this.mode = 'edit';
      this.resetInputs();
      if (restoredScene) {
        this.scene = cloneScene(restoredScene);
      }
      if (this._onPlayStats) this._onPlayStats(this.playState);
    }

    start() {
      if (this.rafId !== null) return;
      this.resize();
      this.centerCameraOnPlayer(true);
      this.lastFrameTime = performance.now();

      const tick = (now) => {
        const rawDt = Math.max(0, Math.min((now - this.lastFrameTime) / 1000, 0.1));
        this.lastFrameTime = now;
        this.time += rawDt;

        this.update(rawDt);
        this.render();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }

    stopLoop() {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    update(dt) {
      if (this.mode !== 'play') return;
      if (this.playState.won || this.playState.lost) {
        this.centerCameraOnPlayer(false);
        return;
      }

      // Fixed physics timestep loop guarantees identical jump height & speed at any FPS
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        const events = global.Physics2D.stepWorld(this.scene, this.input, this.fixedDt);
        this.accumulator -= this.fixedDt;

        if (events.collectedCoinIds.length > 0) {
          this.playState.coinsCollected += events.collectedCoinIds.length;
          if (this._onPlayStats) this._onPlayStats(this.playState);
        }

        if (events.reachedGoal) {
          this.playState.won = true;
          if (this._onPlayStats) this._onPlayStats(this.playState);
          if (this._onToast) {
            this._onToast('Победа! Собрано монет: ' + this.playState.coinsCollected + '/' + this.playState.totalCoins);
          }
          break;
        }

        if (events.playerHit || events.fellOut) {
          this.playState.lost = true;
          if (this._onPlayStats) this._onPlayStats(this.playState);
          if (this._onToast) {
            this._onToast(events.fellOut ? 'Падение в пропасть! Нажми Stop и Play' : 'Столкновение с врагом!');
          }
          break;
        }
      }

      // Smooth 2D camera lerp following player (frame-rate compensated)
      const player = this.findPlayer();
      if (player) {
        const targetX = player.x + player.width * 0.5 - this.viewW * 0.5;
        const targetY = player.y + player.height * 0.5 - this.viewH * 0.55;
        const baseLerp = Math.min(1, Math.max(0.01, Number(this.scene.cameraLerp) || 0.12));
        const smooth = 1 - Math.pow(1 - baseLerp, dt * 60);
        this.camera.x += (targetX - this.camera.x) * smooth;
        this.camera.y += (targetY - this.camera.y) * smooth;
      }
    }

    drawGrid(ctx) {
      const gridSize = 32;
      const startX = Math.floor(this.camera.x / gridSize) * gridSize;
      const endX = this.camera.x + this.viewW + gridSize;
      const startY = Math.floor(this.camera.y / gridSize) * gridSize;
      const endY = this.camera.y + this.viewH + gridSize;

      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.strokeStyle = x % 160 === 0 ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.07)';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.strokeStyle = y % 160 === 0 ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.07)';
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Origin axes
      ctx.strokeStyle = 'rgba(255, 106, 26, 0.32)';
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.lineTo(0, endY);
      ctx.moveTo(startX, 0);
      ctx.lineTo(endX, 0);
      ctx.stroke();
    }

    drawEntity(ctx, ent) {
      if (ent.removed) return;
      ctx.save();

      if (ent.type === 'coin') {
        const cx = ent.x + ent.width * 0.5;
        const cy = ent.y + ent.height * 0.5 + Math.sin(this.time * 4 + ent.x * 0.03) * 2.5;
        const r = Math.min(ent.width, ent.height) * 0.45;
        ctx.fillStyle = ent.color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(120, 53, 15, 0.6)';
        ctx.fillRect(cx - r * 0.14, cy - r * 0.42, r * 0.28, r * 0.84);
      } else if (ent.type === 'trigger') {
        const pulse = 0.28 + 0.14 * Math.sin(this.time * 4);
        ctx.fillStyle = ent.color;
        ctx.globalAlpha = pulse;
        ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = ent.color;
        ctx.strokeRect(ent.x, ent.y, ent.width, ent.height);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', ent.x + ent.width * 0.5, ent.y + ent.height * 0.5 + 3);
      } else {
        ctx.fillStyle = ent.color;
        ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.strokeRect(ent.x, ent.y, ent.width, ent.height);

        if (ent.type === 'platform') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.fillRect(ent.x, ent.y, ent.width, Math.min(5, ent.height * 0.3));
        } else if (ent.type === 'player') {
          const eyeDir = this.mode === 'play' ? this.playState.facing : 1;
          const eyeOffsetX = eyeDir > 0 ? ent.width * 0.58 : ent.width * 0.2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ent.x + eyeOffsetX, ent.y + ent.height * 0.22, 6, 7);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ent.x + eyeOffsetX + (eyeDir > 0 ? 3 : 0), ent.y + ent.height * 0.24, 3, 5);
        } else if (ent.type === 'enemy') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ent.x + 6, ent.y + 8, 6, 6);
          ctx.fillRect(ent.x + ent.width - 12, ent.y + 8, 6, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ent.x + 7, ent.y + 10, 3, 3);
          ctx.fillRect(ent.x + ent.width - 10, ent.y + 10, 3, 3);
        }
      }

      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      if (!ctx) return;
      this.resize();

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Background sky gradient
      const bg = ctx.createLinearGradient(0, 0, 0, this.viewH);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      ctx.save();
      ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

      if (this.mode === 'edit') {
        this.drawGrid(ctx);
      }

      for (let i = 0; i < this.scene.entities.length; i++) {
        this.drawEntity(ctx, this.scene.entities[i]);
      }

      if (this._onBeforeRender) {
        this._onBeforeRender(ctx);
      }

      ctx.restore();
    }

    destroy() {
      this.stopLoop();
      window.removeEventListener('keydown', this._handleKeyDown);
      window.removeEventListener('keyup', this._handleKeyUp);
    }
  }

  global.Engine2DModule = {
    Engine2D: Engine2D,
    ENTITY_PRESETS: ENTITY_PRESETS,
    createEntity: createEntity,
    cloneScene: cloneScene,
    createDefaultScene: createDefaultScene,
  };
})(window);
