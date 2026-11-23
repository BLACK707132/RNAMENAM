(function (global) {
  'use strict';

  const HANDLE_SIZE = 8;

  class VisualEditor {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.engine = new global.Engine2DModule.Engine2D(this.canvas);
      this.selectedId = this.engine.scene.entities[0] ? this.engine.scene.entities[0].id : null;
      this.snapshot = null;
      this.gridSnap = true;
      this.gridSize = 16;
      this.placeModeType = null; // e.g. 'platform' | 'coin' when click-spawn toggled

      this.dragState = null; // { mode: 'move'|'resize'|'pan', handle, startX, startY, origX, origY, origW, origH, camX, camY }
      this.toastTimer = null;

      this._bindDom();
      this._bindCanvasPointer();
      this._wireEngineCallbacks();

      this.refreshHierarchy();
      this.syncInspector();
      this.engine.start();
    }

    _el(id) {
      return document.getElementById(id);
    }

    _wireEngineCallbacks() {
      this.engine._onBeforeRender = (ctx) => {
        if (this.engine.mode !== 'edit') return;
        const selected = this.getSelected();
        if (!selected) return;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(selected.x - 1, selected.y - 1, selected.width + 2, selected.height + 2);

        const handles = this._getHandles(selected);
        for (let i = 0; i < handles.length; i++) {
          const h = handles[i];
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        }
        ctx.restore();
      };

      this.engine._onPlayStats = (stats) => {
        const coinsEl = this._el('stat-coins');
        const statusEl = this._el('stat-status');
        if (coinsEl) coinsEl.textContent = 'Монеты: ' + stats.coinsCollected + '/' + stats.totalCoins;
        if (statusEl) {
          statusEl.textContent = stats.won ? 'Победа!' : stats.lost ? 'Поражение' : 'В игре';
        }
      };

      this.engine._onToast = (msg) => {
        this.showToast(msg);
      };
    }

    showToast(msg) {
      const toast = this._el('status-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function () {
        toast.classList.add('hidden');
      }, 2800);
    }

    snap(val) {
      return this.gridSnap ? Math.round(val / this.gridSize) * this.gridSize : Math.round(val);
    }

    getSelected() {
      if (!this.selectedId) return null;
      return (
        this.engine.scene.entities.find((e) => e.id === this.selectedId && !e.removed) || null
      );
    }

    _getHandles(ent) {
      return [
        { id: 'nw', x: ent.x, y: ent.y },
        { id: 'ne', x: ent.x + ent.width, y: ent.y },
        { id: 'sw', x: ent.x, y: ent.y + ent.height },
        { id: 'se', x: ent.x + ent.width, y: ent.y + ent.height },
      ];
    }

    _screenToWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left + this.engine.camera.x,
        y: clientY - rect.top + this.engine.camera.y,
      };
    }

    addEntity(type, wx, wy) {
      if (this.engine.mode !== 'edit') return;
      const preset = global.Engine2DModule.ENTITY_PRESETS[type] || global.Engine2DModule.ENTITY_PRESETS.platform;
      const targetX =
        typeof wx === 'number'
          ? this.snap(wx - preset.width * 0.5)
          : this.snap(this.engine.camera.x + (this.engine.viewW || 600) * 0.5 - preset.width * 0.5);
      const targetY =
        typeof wy === 'number'
          ? this.snap(wy - preset.height * 0.5)
          : this.snap(this.engine.camera.y + (this.engine.viewH || 400) * 0.5 - preset.height * 0.5);

      const entity = global.Engine2DModule.createEntity(type, targetX, targetY);
      this.engine.scene.entities.push(entity);
      this.selectedId = entity.id;
      this.refreshHierarchy();
      this.syncInspector();
    }

    deleteSelected() {
      if (this.engine.mode !== 'edit' || !this.selectedId) return;
      const idx = this.engine.scene.entities.findIndex((e) => e.id === this.selectedId);
      if (idx === -1) return;
      this.engine.scene.entities.splice(idx, 1);
      const next = this.engine.scene.entities[idx] || this.engine.scene.entities[idx - 1] || null;
      this.selectedId = next ? next.id : null;
      this.refreshHierarchy();
      this.syncInspector();
    }

    duplicateSelected() {
      if (this.engine.mode !== 'edit') return;
      const ent = this.getSelected();
      if (!ent) return;
      const copy = global.Engine2DModule.createEntity(ent.type, ent.x + 32, ent.y + 32, {
        name: ent.name + ' Copy',
        width: ent.width,
        height: ent.height,
        color: ent.color,
        isStatic: ent.isStatic,
        hasGravity: ent.hasGravity,
        speed: ent.speed,
        jumpForce: ent.jumpForce,
        velocity: { x: ent.velocity.x, y: ent.velocity.y },
      });
      this.engine.scene.entities.push(copy);
      this.selectedId = copy.id;
      this.refreshHierarchy();
      this.syncInspector();
    }

    enterPlayMode() {
      if (this.engine.mode === 'play') return;
      this.snapshot = global.Engine2DModule.cloneScene(this.engine.scene);
      this.placeModeType = null;
      this._updatePlaceBtn();

      this.engine.startPlay();
      this._el('btn-play').disabled = true;
      this._el('btn-stop').disabled = false;
      this._el('mode-indicator').textContent = 'PLAY (WASD / Стрелки / Пробел)';
      this._el('mode-indicator').className = 'mode-pill mode-play';
      this._el('play-stats').classList.remove('hidden');
      this._el('touch-controls').classList.remove('hidden');
      this.showToast('Режим игры запущен');
    }

    exitPlayMode() {
      if (this.engine.mode !== 'play') return;
      this.engine.stopPlay(this.snapshot);
      this.snapshot = null;
      this._el('btn-play').disabled = false;
      this._el('btn-stop').disabled = true;
      this._el('mode-indicator').textContent = 'РЕДАКТОР';
      this._el('mode-indicator').className = 'mode-pill mode-edit';
      this._el('play-stats').classList.add('hidden');
      this._el('touch-controls').classList.add('hidden');
      this.refreshHierarchy();
      this.syncInspector();
      this.showToast('Сцена возвращена в исходное состояние');
    }

    _updatePlaceBtn() {
      const btn = this._el('btn-place-mode');
      if (!btn) return;
      if (this.placeModeType) {
        btn.classList.add('active');
        btn.textContent = 'Клик-спавн: ' + this.placeModeType;
      } else {
        btn.classList.remove('active');
        btn.textContent = 'Клик-спавн: Выкл';
      }
    }

    refreshHierarchy() {
      const list = this._el('hierarchy-list');
      const countEl = this._el('entity-count');
      if (!list) return;
      list.innerHTML = '';
      const entities = this.engine.scene.entities;
      if (countEl) countEl.textContent = String(entities.length);

      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        const row = document.createElement('div');
        row.className = 'hierarchy-item' + (ent.id === this.selectedId ? ' selected' : '');

        const left = document.createElement('div');
        left.className = 'hierarchy-left';

        const dot = document.createElement('span');
        dot.className = 'color-dot';
        dot.style.backgroundColor = ent.color;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = ent.name || ent.id;

        left.appendChild(dot);
        left.appendChild(nameSpan);

        const typeSpan = document.createElement('span');
        typeSpan.className = 'item-type';
        typeSpan.textContent = ent.type;

        row.appendChild(left);
        row.appendChild(typeSpan);
        row.addEventListener('click', () => {
          this.selectedId = ent.id;
          this.refreshHierarchy();
          this.syncInspector();
        });
        list.appendChild(row);
      }
    }

    syncInspector() {
      const ent = this.getSelected();
      const empty = this._el('inspector-empty');
      const form = this._el('inspector-form');
      if (!ent) {
        empty.classList.remove('hidden');
        form.classList.add('hidden');
        return;
      }
      empty.classList.add('hidden');
      form.classList.remove('hidden');

      this._el('inp-id').value = ent.id;
      this._el('inp-name').value = ent.name || '';
      this._el('inp-type').value = ent.type;
      this._el('inp-x').value = String(Math.round(ent.x));
      this._el('inp-y').value = String(Math.round(ent.y));
      this._el('inp-w').value = String(Math.round(ent.width));
      this._el('inp-h').value = String(Math.round(ent.height));
      this._el('inp-color').value = ent.color.length === 7 ? ent.color : '#ff6a1a';
      this._el('inp-speed').value = String(ent.speed || 0);
      this._el('inp-vx').value = String(Math.round((ent.velocity && ent.velocity.x) || 0));
      this._el('inp-vy').value = String(Math.round((ent.velocity && ent.velocity.y) || 0));
      this._el('inp-jump').value = String(ent.jumpForce || 0);
      this._el('inp-static').checked = Boolean(ent.isStatic);
      this._el('inp-gravity').checked = Boolean(ent.hasGravity);
      this._el('inp-world-gravity').value = String(this.engine.scene.gravity);
      this._el('inp-cam-lerp').value = String(this.engine.scene.cameraLerp);
    }

    _bindDom() {
      this._el('btn-play').addEventListener('click', () => this.enterPlayMode());
      this._el('btn-stop').addEventListener('click', () => this.exitPlayMode());

      const addButtons = document.querySelectorAll('[data-add-type]');
      for (let i = 0; i < addButtons.length; i++) {
        addButtons[i].addEventListener('click', (e) => {
          const type = e.currentTarget.getAttribute('data-add-type');
          if (this.placeModeType) {
            this.placeModeType = type;
            this._updatePlaceBtn();
            this.showToast('Кликни на сетку, чтобы поставить: ' + type);
          } else {
            this.addEntity(type);
          }
        });
      }

      this._el('btn-place-mode').addEventListener('click', () => {
        this.placeModeType = this.placeModeType ? null : 'platform';
        this._updatePlaceBtn();
        if (this.placeModeType) this.showToast('Кликни на полотно для создания объекта');
      });

      this._el('chk-grid-snap').addEventListener('change', (e) => {
        this.gridSnap = e.target.checked;
      });

      this._el('btn-center-cam').addEventListener('click', () => {
        this.engine.centerCameraOnPlayer(true);
      });

      this._el('btn-reset-demo').addEventListener('click', () => {
        if (this.engine.mode === 'play') this.exitPlayMode();
        this.engine.scene = global.Engine2DModule.createDefaultScene();
        this.selectedId = this.engine.scene.entities[0].id;
        this.engine.centerCameraOnPlayer(true);
        this.refreshHierarchy();
        this.syncInspector();
        this.showToast('Демо-уровень восстановлен');
      });

      this._el('btn-delete').addEventListener('click', () => this.deleteSelected());
      this._el('btn-duplicate').addEventListener('click', () => this.duplicateSelected());

      // Export & Import JSON / Standalone HTML
      this._el('btn-export-json').addEventListener('click', () => {
        const src = this.engine.mode === 'play' && this.snapshot ? this.snapshot : this.engine.scene;
        global.Exporter2D.exportLevelJson(src);
        this.showToast('Уровень сохранён в JSON');
      });

      const fileInput = this._el('input-import-json');
      this._el('btn-import-json').addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        global.Exporter2D.importLevelJson(
          file,
          (loadedScene) => {
            if (this.engine.mode === 'play') this.exitPlayMode();
            this.engine.scene = loadedScene;
            this.selectedId = loadedScene.entities[0] ? loadedScene.entities[0].id : null;
            this.engine.centerCameraOnPlayer(true);
            this.refreshHierarchy();
            this.syncInspector();
            this.showToast('Уровень загружен из JSON');
          },
          (errMsg) => this.showToast(errMsg)
        );
        fileInput.value = '';
      });

      this._el('btn-export-html').addEventListener('click', () => {
        const src = this.engine.mode === 'play' && this.snapshot ? this.snapshot : this.engine.scene;
        global.Exporter2D.exportStandaloneGame(src);
        this.showToast('Скачан готовый index.html (Standalone Game)');
      });

      // Inspector live two-way updates
      const bindField = (id, applyFn, refreshList) => {
        const el = this._el(id);
        if (!el) return;
        el.addEventListener('input', () => {
          const ent = this.getSelected();
          if (!ent) return;
          applyFn(ent, el);
          if (refreshList) this.refreshHierarchy();
        });
      };

      bindField('inp-name', (ent, el) => { ent.name = el.value; }, true);
      bindField('inp-type', (ent, el) => {
        ent.type = el.value;
        if (ent.type === 'platform' || ent.type === 'coin' || ent.type === 'trigger') {
          ent.isStatic = true;
          ent.hasGravity = false;
        }
        this.syncInspector();
      }, true);
      bindField('inp-x', (ent, el) => { ent.x = Number(el.value) || 0; });
      bindField('inp-y', (ent, el) => { ent.y = Number(el.value) || 0; });
      bindField('inp-w', (ent, el) => { ent.width = Math.max(8, Number(el.value) || 8); });
      bindField('inp-h', (ent, el) => { ent.height = Math.max(8, Number(el.value) || 8); });
      bindField('inp-color', (ent, el) => { ent.color = el.value; }, true);
      bindField('inp-speed', (ent, el) => { ent.speed = Math.max(0, Number(el.value) || 0); });
      bindField('inp-vx', (ent, el) => {
        if (!ent.velocity) ent.velocity = { x: 0, y: 0 };
        ent.velocity.x = Number(el.value) || 0;
      });
      bindField('inp-vy', (ent, el) => {
        if (!ent.velocity) ent.velocity = { x: 0, y: 0 };
        ent.velocity.y = Number(el.value) || 0;
      });
      bindField('inp-jump', (ent, el) => { ent.jumpForce = Math.max(0, Number(el.value) || 0); });
      bindField('inp-static', (ent, el) => { ent.isStatic = el.checked; });
      bindField('inp-gravity', (ent, el) => { ent.hasGravity = el.checked; });

      this._el('inp-world-gravity').addEventListener('input', (e) => {
        this.engine.scene.gravity = Math.max(0, Number(e.target.value) || 0);
      });
      this._el('inp-cam-lerp').addEventListener('input', (e) => {
        this.engine.scene.cameraLerp = Math.min(1, Math.max(0.01, Number(e.target.value) || 0.12));
      });

      // Editor delete shortcut
      window.addEventListener('keydown', (e) => {
        if (this.engine.mode !== 'edit') return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          this.deleteSelected();
        }
      });

      // On-screen Touch D-pad for Play mode
      const bindTouchBtn = (id, key) => {
        const el = this._el(id);
        if (!el) return;
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          el.classList.add('pressed');
          this.engine.setInputState(key, true);
        });
        const release = () => {
          el.classList.remove('pressed');
          this.engine.setInputState(key, false);
        };
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('pointerleave', release);
      };
      bindTouchBtn('touch-left', 'left');
      bindTouchBtn('touch-right', 'right');
      bindTouchBtn('touch-jump', 'jump');
    }

    _bindCanvasPointer() {
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.engine.mode !== 'edit') return;
        const world = this._screenToWorld(e.clientX, e.clientY);

        // Right-click, middle-click, or Shift+click pans editor camera
        if (e.button === 1 || e.button === 2 || e.shiftKey) {
          this.dragState = {
            mode: 'pan',
            startClientX: e.clientX,
            startClientY: e.clientY,
            camX: this.engine.camera.x,
            camY: this.engine.camera.y,
          };
          this.canvas.setPointerCapture(e.pointerId);
          return;
        }

        // Click-to-place mode
        if (this.placeModeType) {
          this.addEntity(this.placeModeType, world.x, world.y);
          return;
        }

        // Check resize handles on selected entity first
        const selected = this.getSelected();
        if (selected) {
          const handles = this._getHandles(selected);
          for (let i = 0; i < handles.length; i++) {
            const h = handles[i];
            if (Math.abs(world.x - h.x) <= 9 && Math.abs(world.y - h.y) <= 9) {
              this.dragState = {
                mode: 'resize',
                handle: h.id,
                startX: world.x,
                startY: world.y,
                origX: selected.x,
                origY: selected.y,
                origW: selected.width,
                origH: selected.height,
              };
              this.canvas.setPointerCapture(e.pointerId);
              return;
            }
          }
        }

        // Hit-test entities from top-most to bottom-most
        let hit = null;
        for (let i = this.engine.scene.entities.length - 1; i >= 0; i--) {
          const ent = this.engine.scene.entities[i];
          if (ent.removed) continue;
          if (
            world.x >= ent.x &&
            world.x <= ent.x + ent.width &&
            world.y >= ent.y &&
            world.y <= ent.y + ent.height
          ) {
            hit = ent;
            break;
          }
        }

        if (hit) {
          this.selectedId = hit.id;
          this.refreshHierarchy();
          this.syncInspector();
          this.dragState = {
            mode: 'move',
            startX: world.x,
            startY: world.y,
            origX: hit.x,
            origY: hit.y,
          };
          this.canvas.setPointerCapture(e.pointerId);
        } else {
          // Clicking empty space drags camera smoothly
          this.selectedId = null;
          this.refreshHierarchy();
          this.syncInspector();
          this.dragState = {
            mode: 'pan',
            startClientX: e.clientX,
            startClientY: e.clientY,
            camX: this.engine.camera.x,
            camY: this.engine.camera.y,
          };
          this.canvas.setPointerCapture(e.pointerId);
        }
      });

      this.canvas.addEventListener('pointermove', (e) => {
        const world = this._screenToWorld(e.clientX, e.clientY);
        const coordsEl = this._el('viewport-coords');
        if (coordsEl) {
          coordsEl.textContent = 'X: ' + Math.round(world.x) + ' · Y: ' + Math.round(world.y);
        }

        if (!this.dragState || this.engine.mode !== 'edit') return;

        if (this.dragState.mode === 'pan') {
          this.engine.camera.x = this.dragState.camX - (e.clientX - this.dragState.startClientX);
          this.engine.camera.y = this.dragState.camY - (e.clientY - this.dragState.startClientY);
          return;
        }

        const ent = this.getSelected();
        if (!ent) return;

        const dx = world.x - this.dragState.startX;
        const dy = world.y - this.dragState.startY;

        if (this.dragState.mode === 'move') {
          ent.x = this.snap(this.dragState.origX + dx);
          ent.y = this.snap(this.dragState.origY + dy);
          this.syncInspector();
        } else if (this.dragState.mode === 'resize') {
          const minSize = 16;
          let nx = this.dragState.origX;
          let ny = this.dragState.origY;
          let nw = this.dragState.origW;
          let nh = this.dragState.origH;

          if (this.dragState.handle.includes('e')) {
            nw = Math.max(minSize, this.snap(this.dragState.origW + dx));
          }
          if (this.dragState.handle.includes('s')) {
            nh = Math.max(minSize, this.snap(this.dragState.origH + dy));
          }
          if (this.dragState.handle.includes('w')) {
            const right = this.dragState.origX + this.dragState.origW;
            nx = Math.min(right - minSize, this.snap(this.dragState.origX + dx));
            nw = right - nx;
          }
          if (this.dragState.handle.includes('n')) {
            const bottom = this.dragState.origY + this.dragState.origH;
            ny = Math.min(bottom - minSize, this.snap(this.dragState.origY + dy));
            nh = bottom - ny;
          }

          ent.x = nx;
          ent.y = ny;
          ent.width = nw;
          ent.height = nh;
          this.syncInspector();
        }
      });

      const endDrag = () => {
        this.dragState = null;
      };
      this.canvas.addEventListener('pointerup', endDrag);
      this.canvas.addEventListener('pointercancel', endDrag);
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    global.editorInstance = new VisualEditor();
  });
})(window);
