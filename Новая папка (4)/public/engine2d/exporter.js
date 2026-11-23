(function (global) {
  'use strict';

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportLevelJson(scene) {
    const clean = global.Engine2DModule.cloneScene(scene);
    const json = JSON.stringify(clean, null, 2);
    const safeName = (clean.name || 'level').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    downloadFile(safeName + '.json', json, 'application/json;charset=utf-8');
  }

  function importLevelJson(file, onSuccess, onError) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || !Array.isArray(parsed.entities)) {
          throw new Error('Некорректный JSON уровня: отсутствует массив entities.');
        }
        const normalized = global.Engine2DModule.cloneScene(parsed);
        onSuccess(normalized);
      } catch (err) {
        onError(err && err.message ? err.message : 'Ошибка чтения JSON');
      }
    };
    reader.onerror = function () {
      onError('Не удалось прочитать файл');
    };
    reader.readAsText(file);
  }

  /**
   * Generates a standalone playable HTML5 game file (index.html) without any Editor UI.
   * Ready for static web hosting or Capacitor Android APK packaging.
   */
  function exportStandaloneGame(scene) {
    const cleanScene = global.Engine2DModule.cloneScene(scene);
    const serializedScene = JSON.stringify(cleanScene).replace(/<\/script/gi, '<\\/script');
    const title = String(cleanScene.name || 'BLACK 2D Game').replace(/[<>]/g, '');

    const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; user-select: none; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0f172a; font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    .hud { position: fixed; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; gap: 10px; }
    .pill { background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(255,255,255,0.16); padding: 7px 12px; border-radius: 10px; font-weight: 800; font-size: 13px; backdrop-filter: blur(4px); }
    .btn { pointer-events: auto; background: #ff6a1a; color: #fff; border: 0; border-radius: 10px; padding: 8px 14px; font-weight: 800; font-size: 13px; cursor: pointer; }
    .overlay { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(10, 15, 26, 0.78); padding: 20px; }
    .overlay.show { display: flex; }
    .card { background: #151b24; border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 24px; text-align: center; max-width: 340px; width: 100%; }
    .card h2 { margin: 0 0 8px; font-size: 24px; }
    .card p { margin: 0 0 18px; color: #cbd5e1; font-size: 14px; }
    .touch { position: fixed; left: 14px; right: 14px; bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; pointer-events: none; }
    .touch-group { display: flex; gap: 10px; pointer-events: auto; }
    .tbtn { width: 58px; height: 58px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); background: rgba(15,23,42,0.72); color: #fff; font-size: 20px; font-weight: 900; touch-action: none; }
    .tjump { width: auto; padding: 0 20px; font-size: 14px; background: rgba(22,163,74,0.82); pointer-events: auto; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <div class="hud">
    <div class="pill" id="hud-coins">Монеты: 0/0</div>
    <button class="btn" id="btn-restart" type="button">Заново</button>
  </div>
  <div class="touch">
    <div class="touch-group">
      <button class="tbtn" id="tl" type="button">◀</button>
      <button class="tbtn" id="tr" type="button">▶</button>
    </div>
    <button class="tbtn tjump" id="tj" type="button">ПРЫЖОК</button>
  </div>
  <div class="overlay" id="end-overlay">
    <div class="card">
      <h2 id="end-title">Уровень пройден!</h2>
      <p id="end-desc"></p>
      <button class="btn" id="btn-again" type="button">Играть снова</button>
    </div>
  </div>
  <script>
    (function () {
      'use strict';
      var INITIAL_SCENE = ${serializedScene};
      var Physics2D = {
        aabbOverlap: function (a, b) {
          return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        },
        moveAndCollide: function (ent, solids, dt) {
          ent.onGround = false;
          ent.x += ent.velocity.x * dt;
          for (var i = 0; i < solids.length; i++) {
            var s = solids[i];
            if (s.id === ent.id || !this.aabbOverlap(ent, s)) continue;
            if (ent.velocity.x > 0) {
              ent.x = s.x - ent.width;
              ent.velocity.x = ent.type === 'enemy' ? -Math.abs(ent.velocity.x || ent.speed || 110) : 0;
            } else if (ent.velocity.x < 0) {
              ent.x = s.x + s.width;
              ent.velocity.x = ent.type === 'enemy' ? Math.abs(ent.velocity.x || ent.speed || 110) : 0;
            }
          }
          ent.y += ent.velocity.y * dt;
          for (var j = 0; j < solids.length; j++) {
            var sy = solids[j];
            if (sy.id === ent.id || !this.aabbOverlap(ent, sy)) continue;
            if (ent.velocity.y > 0) {
              ent.y = sy.y - ent.height;
              ent.velocity.y = 0;
              ent.onGround = true;
            } else if (ent.velocity.y < 0) {
              ent.y = sy.y + sy.height;
              ent.velocity.y = 0;
            }
          }
        },
        stepWorld: function (scene, input, dt) {
          var gravity = typeof scene.gravity === 'number' ? scene.gravity : 1450;
          var solids = [];
          var player = null;
          for (var i = 0; i < scene.entities.length; i++) {
            var e = scene.entities[i];
            if (e.removed) continue;
            if (e.type === 'platform') solids.push(e);
            if (e.type === 'player' && !player) player = e;
          }
          for (var k = 0; k < scene.entities.length; k++) {
            var ent = scene.entities[k];
            if (ent.removed || ent.isStatic) continue;
            if (ent.type === 'player') {
              var spd = ent.speed || 280;
              var jmp = ent.jumpForce || 560;
              var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
              if (dir !== 0) ent.velocity.x = dir * spd;
              else {
                ent.velocity.x *= Math.exp(-(ent.onGround ? 14 : 6) * dt);
                if (Math.abs(ent.velocity.x) < 4) ent.velocity.x = 0;
              }
              if (input.jump && ent.onGround) {
                ent.velocity.y = -jmp;
                ent.onGround = false;
              }
            } else if (ent.type === 'enemy' && Math.abs(ent.velocity.x) < 1) {
              ent.velocity.x = ent.speed || 110;
            }
            if (ent.hasGravity) ent.velocity.y = Math.min(ent.velocity.y + gravity * dt, 1600);
            this.moveAndCollide(ent, solids, dt);
            if (ent.type === 'enemy' && ent.onGround && Math.abs(ent.velocity.x) > 1) {
              var px = ent.velocity.x > 0 ? ent.x + ent.width + 2 : ent.x - 2;
              var py = ent.y + ent.height + 4;
              var ok = false;
              for (var s = 0; s < solids.length; s++) {
                var p = solids[s];
                if (px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height) { ok = true; break; }
              }
              if (!ok) ent.velocity.x = -ent.velocity.x;
            }
          }
          var ev = { coins: 0, won: false, lost: false };
          if (player) {
            for (var m = 0; m < scene.entities.length; m++) {
              var o = scene.entities[m];
              if (o.removed || o.id === player.id || !this.aabbOverlap(player, o)) continue;
              if (o.type === 'coin') { o.removed = true; ev.coins++; }
              else if (o.type === 'trigger') { ev.won = true; }
              else if (o.type === 'enemy') {
                var prevBottom = player.y + player.height - player.velocity.y * dt;
                if (player.velocity.y > 40 && prevBottom <= o.y + 14) { o.removed = true; player.velocity.y = -420; }
                else ev.lost = true;
              }
            }
            if (player.y > 1600) ev.lost = true;
          }
          return ev;
        }
      };

      var canvas = document.getElementById('game');
      var ctx = canvas.getContext('2d');
      var hudCoins = document.getElementById('hud-coins');
      var overlay = document.getElementById('end-overlay');
      var endTitle = document.getElementById('end-title');
      var endDesc = document.getElementById('end-desc');
      var input = { left: false, right: false, jump: false };
      var scene, coinsCollected, totalCoins, finished, facing, cam = { x: 0, y: 0 }, time = 0, acc = 0;

      function resetGame() {
        scene = JSON.parse(JSON.stringify(INITIAL_SCENE));
        coinsCollected = 0;
        totalCoins = scene.entities.filter(function (e) { return e.type === 'coin'; }).length;
        finished = false;
        facing = 1;
        overlay.classList.remove('show');
        hudCoins.textContent = 'Монеты: 0/' + totalCoins;
        var p = scene.entities.find(function (e) { return e.type === 'player'; });
        if (p) { cam.x = p.x - window.innerWidth * 0.5; cam.y = p.y - window.innerHeight * 0.55; }
      }

      window.addEventListener('keydown', function (e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { input.left = true; facing = -1; }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { input.right = true; facing = 1; }
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); input.jump = true; }
      });
      window.addEventListener('keyup', function (e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') input.jump = false;
      });
      function bindTouch(id, key) {
        var el = document.getElementById(id);
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); input[key] = true; if (key === 'left') facing = -1; if (key === 'right') facing = 1; });
        var up = function () { input[key] = false; };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
      }
      bindTouch('tl', 'left');
      bindTouch('tr', 'right');
      bindTouch('tj', 'jump');
      document.getElementById('btn-restart').addEventListener('click', resetGame);
      document.getElementById('btn-again').addEventListener('click', resetGame);

      resetGame();
      var last = performance.now();
      function frame(now) {
        var dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
        last = now;
        time += dt;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var vw = window.innerWidth, vh = window.innerHeight;
        if (canvas.width !== Math.floor(vw * dpr) || canvas.height !== Math.floor(vh * dpr)) {
          canvas.width = Math.floor(vw * dpr); canvas.height = Math.floor(vh * dpr);
        }
        if (!finished) {
          acc += dt;
          while (acc >= 1 / 60) {
            var ev = Physics2D.stepWorld(scene, input, 1 / 60);
            acc -= 1 / 60;
            if (ev.coins) { coinsCollected += ev.coins; hudCoins.textContent = 'Монеты: ' + coinsCollected + '/' + totalCoins; }
            if (ev.won || ev.lost) {
              finished = true;
              endTitle.textContent = ev.won ? 'Уровень пройден!' : 'Попробуй ещё раз';
              endDesc.textContent = 'Собрано монет: ' + coinsCollected + ' из ' + totalCoins;
              overlay.classList.add('show');
              break;
            }
          }
        }
        var player = scene.entities.find(function (e) { return !e.removed && e.type === 'player'; });
        if (player) {
          var tx = player.x + player.width * 0.5 - vw * 0.5;
          var ty = player.y + player.height * 0.5 - vh * 0.55;
          var s = 1 - Math.pow(1 - (scene.cameraLerp || 0.12), dt * 60);
          cam.x += (tx - cam.x) * s;
          cam.y += (ty - cam.y) * s;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var g = ctx.createLinearGradient(0, 0, 0, vh);
        g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e293b');
        ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
        ctx.save();
        ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
        for (var i = 0; i < scene.entities.length; i++) {
          var ent = scene.entities[i];
          if (ent.removed) continue;
          if (ent.type === 'coin') {
            var cx = ent.x + ent.width * 0.5, cy = ent.y + ent.height * 0.5 + Math.sin(time * 4 + ent.x * 0.03) * 2.5;
            ctx.fillStyle = ent.color; ctx.beginPath(); ctx.arc(cx, cy, Math.min(ent.width, ent.height) * 0.45, 0, Math.PI * 2); ctx.fill();
          } else if (ent.type === 'trigger') {
            ctx.fillStyle = ent.color; ctx.globalAlpha = 0.35; ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
            ctx.globalAlpha = 1; ctx.strokeStyle = ent.color; ctx.lineWidth = 2; ctx.strokeRect(ent.x, ent.y, ent.width, ent.height);
          } else {
            ctx.fillStyle = ent.color; ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
            if (ent.type === 'player') {
              ctx.fillStyle = '#fff'; ctx.fillRect(ent.x + (facing > 0 ? ent.width * 0.58 : ent.width * 0.2), ent.y + ent.height * 0.22, 6, 7);
            }
          }
        }
        ctx.restore();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();
  </script>
</body>
</html>`;

    downloadFile('index.html', html, 'text/html;charset=utf-8');
  }

  global.Exporter2D = {
    exportLevelJson: exportLevelJson,
    importLevelJson: importLevelJson,
    exportStandaloneGame: exportStandaloneGame,
  };
})(window);
