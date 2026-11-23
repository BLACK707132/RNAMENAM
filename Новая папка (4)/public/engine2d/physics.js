(function (global) {
  'use strict';

  /**
   * 2D AABB Collision & Physics Solver (pure vanilla JS)
   * Handles gravity, friction, jumping, 4-sided solid AABB collisions without snagging,
   * enemy patrol wall bouncing, coin collection, and goal/damage triggers.
   */
  const Physics2D = {
    aabbOverlap(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    },

    isSolid(entity) {
      return entity.type === 'platform';
    },

    /**
     * Resolves axis-separated movement so bodies never snag on tile seams or corners.
     */
    moveAndCollide(entity, solids, dt) {
      entity.onGround = false;

      // 1) Horizontal step & X-axis AABB resolution
      entity.x += entity.velocity.x * dt;
      for (let i = 0; i < solids.length; i++) {
        const solid = solids[i];
        if (solid.id === entity.id) continue;
        if (!Physics2D.aabbOverlap(entity, solid)) continue;

        if (entity.velocity.x > 0) {
          entity.x = solid.x - entity.width;
          if (entity.type === 'enemy') {
            entity.velocity.x = -Math.abs(entity.velocity.x || entity.speed || 110);
          } else {
            entity.velocity.x = 0;
          }
        } else if (entity.velocity.x < 0) {
          entity.x = solid.x + solid.width;
          if (entity.type === 'enemy') {
            entity.velocity.x = Math.abs(entity.velocity.x || entity.speed || 110);
          } else {
            entity.velocity.x = 0;
          }
        }
      }

      // 2) Vertical step & Y-axis AABB resolution
      entity.y += entity.velocity.y * dt;
      for (let i = 0; i < solids.length; i++) {
        const solid = solids[i];
        if (solid.id === entity.id) continue;
        if (!Physics2D.aabbOverlap(entity, solid)) continue;

        if (entity.velocity.y > 0) {
          entity.y = solid.y - entity.height;
          entity.velocity.y = 0;
          entity.onGround = true;
        } else if (entity.velocity.y < 0) {
          entity.y = solid.y + solid.height;
          entity.velocity.y = 0;
        }
      }
    },

    /**
     * Advances physics for one simulation step (dt in seconds).
     */
    stepWorld(scene, input, dt) {
      const gravity = typeof scene.gravity === 'number' ? scene.gravity : 1450;
      const entities = scene.entities;
      const solids = [];
      for (let i = 0; i < entities.length; i++) {
        if (!entities[i].removed && Physics2D.isSolid(entities[i])) {
          solids.push(entities[i]);
        }
      }

      let player = null;
      for (let i = 0; i < entities.length; i++) {
        if (!entities[i].removed && entities[i].type === 'player') {
          player = entities[i];
          break;
        }
      }

      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        if (ent.removed || ent.isStatic) continue;

        if (!ent.velocity) ent.velocity = { x: 0, y: 0 };

        if (ent.type === 'player') {
          const moveSpeed = typeof ent.speed === 'number' ? ent.speed : 280;
          const jumpForce = typeof ent.jumpForce === 'number' ? ent.jumpForce : 560;

          let moveDir = 0;
          if (input.left) moveDir -= 1;
          if (input.right) moveDir += 1;

          if (moveDir !== 0) {
            ent.velocity.x = moveDir * moveSpeed;
          } else {
            // Smooth horizontal friction (frame-rate independent exponential damping)
            const friction = ent.onGround ? 14 : 6;
            ent.velocity.x *= Math.exp(-friction * dt);
            if (Math.abs(ent.velocity.x) < 4) ent.velocity.x = 0;
          }

          if (input.jump && ent.onGround) {
            ent.velocity.y = -jumpForce;
            ent.onGround = false;
          }
        } else if (ent.type === 'enemy') {
          const patrolSpeed = typeof ent.speed === 'number' && ent.speed > 0 ? ent.speed : 110;
          if (Math.abs(ent.velocity.x) < 1) {
            ent.velocity.x = patrolSpeed;
          }
        }

        if (ent.hasGravity) {
          ent.velocity.y = Math.min(ent.velocity.y + gravity * dt, 1600);
        }

        Physics2D.moveAndCollide(ent, solids, dt);

        // Keep patrolling enemies from walking off platform edges when grounded
        if (ent.type === 'enemy' && ent.onGround && Math.abs(ent.velocity.x) > 1) {
          const probeX = ent.velocity.x > 0 ? ent.x + ent.width + 2 : ent.x - 2;
          const probeY = ent.y + ent.height + 4;
          let hasFloorAhead = false;
          for (let s = 0; s < solids.length; s++) {
            const p = solids[s];
            if (probeX >= p.x && probeX <= p.x + p.width && probeY >= p.y && probeY <= p.y + p.height) {
              hasFloorAhead = true;
              break;
            }
          }
          if (!hasFloorAhead) {
            ent.velocity.x = -ent.velocity.x;
          }
        }
      }

      const events = {
        collectedCoinIds: [],
        reachedGoal: false,
        playerHit: false,
        fellOut: false,
      };

      if (player && !player.removed) {
        for (let i = 0; i < entities.length; i++) {
          const other = entities[i];
          if (other.removed || other.id === player.id) continue;
          if (!Physics2D.aabbOverlap(player, other)) continue;

          if (other.type === 'coin') {
            other.removed = true;
            events.collectedCoinIds.push(other.id);
          } else if (other.type === 'trigger') {
            events.reachedGoal = true;
          } else if (other.type === 'enemy') {
            // Stomp enemy from above if falling onto its head, otherwise hurt player
            const playerBottomPrev = player.y + player.height - player.velocity.y * dt;
            if (player.velocity.y > 40 && playerBottomPrev <= other.y + 14) {
              other.removed = true;
              player.velocity.y = -420;
            } else {
              events.playerHit = true;
            }
          }
        }

        if (player.y > 1600) {
          events.fellOut = true;
        }
      }

      return events;
    },
  };

  global.Physics2D = Physics2D;
})(window);
