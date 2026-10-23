(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const stage = document.getElementById('stage');
      const overlay = document.getElementById('overlay');
      const playButton = document.getElementById('play-button');
      const titleEl = document.getElementById('overlay-title');
      const descriptionEl = document.getElementById('overlay-description');
      const tipEl = document.getElementById('overlay-tip');
      const scoreEl = document.getElementById('score');
      const bestEl = document.getElementById('best');
      const livesEl = document.getElementById('lives');
      const W = canvas.width;
      const H = canvas.height;

      let state = 'menu';
      let lastTime = 0;
      let elapsed = 0;
      let score = 0;
      let bonusScore = 0;
      let lives = 3;
      let meteorTimer = 0;
      let pickupTimer = 1.8;
      let pointerX = null;
      let best = 0;
      try { best = Number(localStorage.getItem('orbita-best')) || 0; } catch (_) {}
      bestEl.textContent = String(best).padStart(4, '0');

      const keys = Object.create(null);
      const player = { x: W / 2, y: H - 82, r: 17, speed: 465, invuln: 0, tilt: 0 };
      const meteors = [];
      const pickups = [];
      const particles = [];
      const stars = [];
      for (let i = 0; i < 145; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.55 + .25, speed: 12 + Math.random() * 47, alpha: .2 + Math.random() * .72, phase: Math.random() * Math.PI * 2 });
      }

      function updateHud() {
        scoreEl.textContent = String(score).padStart(4, '0');
        livesEl.textContent = lives > 0 ? ('♥ '.repeat(lives).trim() + ' ' + '· '.repeat(3 - lives).trim()) : '— — —';
        bestEl.textContent = String(best).padStart(4, '0');
      }

      function startGame() {
        state = 'playing'; elapsed = 0; score = 0; bonusScore = 0; lives = 3;
        meteorTimer = .45; pickupTimer = 2.5; pointerX = null;
        player.x = W / 2; player.invuln = 0; player.tilt = 0;
        meteors.length = 0; pickups.length = 0; particles.length = 0;
        overlay.hidden = true;
        updateHud();
      }

      function endGame() {
        state = 'over';
        const newRecord = score > best;
        if (newRecord) {
          best = score;
          try { localStorage.setItem('orbita-best', String(best)); } catch (_) {}
        }
        updateHud();
        titleEl.innerHTML = 'MISSÃO<br><span>ENCERRADA.</span>';
        descriptionEl.textContent = `Você sobreviveu por ${Math.floor(elapsed)}s e marcou ${score} pontos. Que tal tentar de novo?`;
        playButton.textContent = 'TENTAR DE NOVO  ↗';
        tipEl.textContent = newRecord ? 'Novo recorde! A galáxia inteira está falando de você.' : 'Dica: pegue os núcleos brilhantes para ganhar pontos extras.';
        overlay.hidden = false;
        playButton.focus({ preventScroll: true });
      }

      function showMenu() {
        state = 'menu';
        titleEl.innerHTML = 'DESVIE DO<br><span>CAOS.</span>';
        descriptionEl.textContent = 'Pilote sua nave por um campo de asteroides. Aguente firme, colete energia e faça história na galáxia.';
        playButton.textContent = 'INICIAR MISSÃO  ↗';
        tipEl.textContent = 'Você tem 3 vidas. O espaço não perdoa distrações.';
        overlay.hidden = false;
      }

      playButton.addEventListener('click', startGame);
      window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (['arrowleft', 'arrowright', ' ', 'a', 'd'].includes(key)) event.preventDefault();
        keys[key] = true;
        if ((key === ' ' || key === 'enter') && !event.repeat && state !== 'playing') startGame();
      });
      window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });
      window.addEventListener('blur', () => { for (const key in keys) keys[key] = false; pointerX = null; });

      function pointerPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const scale = W / rect.width;
        return Math.max(24, Math.min(W - 24, (event.clientX - rect.left) * scale));
      }
      canvas.addEventListener('pointerdown', (event) => {
        if (state === 'playing') { pointerX = pointerPosition(event); canvas.setPointerCapture?.(event.pointerId); }
      });
      canvas.addEventListener('pointermove', (event) => {
        if (state === 'playing' && (event.pointerType === 'touch' || event.buttons > 0)) pointerX = pointerPosition(event);
      });
      canvas.addEventListener('pointerup', () => { pointerX = null; });
      canvas.addEventListener('pointercancel', () => { pointerX = null; });

      function spawnMeteor() {
        const r = 15 + Math.random() * 19;
        const count = 8 + Math.floor(Math.random() * 4);
        const points = [];
        for (let i = 0; i < count; i++) points.push(.76 + Math.random() * .4);
        const speed = 175 + Math.min(190, elapsed * 4.4) + Math.random() * 68;
        meteors.push({
          x: r + Math.random() * (W - 2 * r), y: -r - 5, r,
          vx: (Math.random() - .5) * (35 + elapsed * 1.3), vy: speed,
          angle: Math.random() * Math.PI * 2, spin: (Math.random() - .5) * 1.9,
          points, shade: Math.random() > .5 ? '#d47e70' : '#9e7d83',
        });
      }

      function spawnPickup() {
        pickups.push({ x: 35 + Math.random() * (W - 70), y: -24, r: 12, vy: 140 + Math.min(110, elapsed * 2), phase: Math.random() * 6, spin: Math.random() * 2 - 1 });
      }

      function burst(x, y, color, amount = 18, force = 220) {
        for (let i = 0; i < amount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * force;
          const life = .35 + Math.random() * .65;
          particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, max: life, size: 1.5 + Math.random() * 3.5, color });
        }
      }

      function update(dt) {
        for (const star of stars) {
          star.y += star.speed * dt * (state === 'playing' ? 1.35 : .32);
          if (star.y > H + 2) { star.y = -2; star.x = Math.random() * W; }
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt;
          p.vx *= Math.pow(.16, dt); p.vy *= Math.pow(.16, dt); p.life -= dt;
          if (p.life <= 0) particles.splice(i, 1);
        }
        if (state !== 'playing') return;

        elapsed += dt;
        score = Math.floor(elapsed * 10) + bonusScore;
        const left = keys.arrowleft || keys.a;
        const right = keys.arrowright || keys.d;
        let direction = (right ? 1 : 0) - (left ? 1 : 0);
        if (direction !== 0) {
          player.x += direction * player.speed * dt;
          player.tilt += ((direction * .28) - player.tilt) * Math.min(1, dt * 8);
          pointerX = null;
        } else if (pointerX !== null) {
          const difference = pointerX - player.x;
          player.x += difference * Math.min(1, dt * 12);
          player.tilt += (Math.max(-.27, Math.min(.27, difference * .001)) - player.tilt) * Math.min(1, dt * 7);
        } else {
          player.tilt *= Math.pow(.04, dt);
        }
        player.x = Math.max(24, Math.min(W - 24, player.x));
        player.invuln = Math.max(0, player.invuln - dt);

        meteorTimer -= dt;
        const interval = Math.max(.31, .88 - elapsed * .0065);
        if (meteorTimer <= 0) { spawnMeteor(); meteorTimer = interval * (.72 + Math.random() * .56); }
        pickupTimer -= dt;
        if (pickupTimer <= 0) { spawnPickup(); pickupTimer = 3.2 + Math.random() * 2.4; }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.angle += m.spin * dt;
          if (m.x < m.r || m.x > W - m.r) m.vx *= -1;
          if (m.y > H + m.r) { meteors.splice(i, 1); continue; }
          if (player.invuln <= 0 && Math.hypot(m.x - player.x, m.y - player.y) < m.r * .78 + player.r * .72) {
            burst(player.x, player.y, '#ff849e', 24, 260); burst(m.x, m.y, '#ffac83', 12, 130);
            meteors.splice(i, 1); lives--; player.invuln = 1.15; updateHud();
            if (lives <= 0) { endGame(); return; }
          }
        }

        for (let i = pickups.length - 1; i >= 0; i--) {
          const item = pickups[i]; item.y += item.vy * dt; item.phase += dt * 3.5;
          if (item.y > H + 30) { pickups.splice(i, 1); continue; }
          if (Math.hypot(item.x - player.x, item.y - player.y) < item.r + player.r) {
            bonusScore += 100; score = Math.floor(elapsed * 10) + bonusScore;
            burst(item.x, item.y, '#70fff0', 20, 190); pickups.splice(i, 1); updateHud();
          }
        }
        updateHud();
      }

      function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, '#0b1127'); gradient.addColorStop(.55, '#090f20'); gradient.addColorStop(1, '#11152b');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
        const nebulaA = ctx.createRadialGradient(220, 205, 10, 220, 205, 340);
        nebulaA.addColorStop(0, 'rgba(90, 75, 183, .16)'); nebulaA.addColorStop(1, 'rgba(90,75,183,0)');
        ctx.fillStyle = nebulaA; ctx.fillRect(0, 0, W, H);
        const nebulaB = ctx.createRadialGradient(790, 350, 5, 790, 350, 310);
        nebulaB.addColorStop(0, 'rgba(36, 159, 177, .12)'); nebulaB.addColorStop(1, 'rgba(36,159,177,0)');
        ctx.fillStyle = nebulaB; ctx.fillRect(0, 0, W, H);
        for (const star of stars) {
          const pulse = .72 + .28 * Math.sin(performance.now() * .0013 + star.phase);
          ctx.globalAlpha = star.alpha * pulse;
          ctx.fillStyle = '#e4f6ff'; ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // faint orbital traces
        ctx.strokeStyle = 'rgba(146, 165, 255, .045)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(482, 300, 370, 165, -.12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(482, 300, 445, 210, -.12, 0, Math.PI * 2); ctx.stroke();
      }

      function drawMeteor(m) {
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angle);
        ctx.shadowColor = 'rgba(255, 126, 103, .22)'; ctx.shadowBlur = 18;
        const rock = ctx.createRadialGradient(-m.r * .35, -m.r * .4, 2, 0, 0, m.r * 1.2);
        rock.addColorStop(0, '#d6a08d'); rock.addColorStop(.42, m.shade); rock.addColorStop(1, '#473e59');
        ctx.beginPath();
        for (let i = 0; i < m.points.length; i++) {
          const a = i / m.points.length * Math.PI * 2;
          const radius = m.r * m.points[i];
          const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fillStyle = rock; ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255, 190, 165, .42)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = 'rgba(52, 41, 61, .35)';
        ctx.beginPath(); ctx.ellipse(-m.r * .2, -m.r * .1, m.r * .2, m.r * .13, .4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(m.r * .3, m.r * .24, m.r * .13, m.r * .09, -.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      function drawPickup(item) {
        ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.phase * .3 + item.spin);
        const pulse = 1 + Math.sin(item.phase * 2) * .11;
        ctx.scale(pulse, pulse);
        ctx.shadowColor = '#59ffe7'; ctx.shadowBlur = 22;
        ctx.strokeStyle = 'rgba(105, 255, 232, .65)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(item.phase * 2) * 2, 0, Math.PI * 2); ctx.stroke();
        const gem = ctx.createLinearGradient(-9, -12, 9, 12);
        gem.addColorStop(0, '#e1fff9'); gem.addColorStop(.45, '#68f7e8'); gem.addColorStop(1, '#48aee9');
        ctx.fillStyle = gem; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(10, -2); ctx.lineTo(5, 11); ctx.lineTo(0, 15); ctx.lineTo(-5, 11); ctx.lineTo(-10, -2); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }

      function drawPlayer() {
        if (state === 'over') return;
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.tilt);
        const blink = player.invuln > 0 && Math.floor(player.invuln * 13) % 2 === 0;
        if (blink) ctx.globalAlpha = .42;
        if (player.invuln > 0) {
          ctx.strokeStyle = 'rgba(111, 244, 255, .55)'; ctx.lineWidth = 2;
          ctx.shadowColor = '#59eaff'; ctx.shadowBlur = 19;
          ctx.beginPath(); ctx.arc(0, 0, 29 + Math.sin(performance.now() * .02) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        }
        const flame = 13 + Math.sin(performance.now() * .025) * 4 + (state === 'playing' ? 3 : 0);
        const fire = ctx.createLinearGradient(0, 10, 0, 31 + flame);
        fire.addColorStop(0, '#fff5aa'); fire.addColorStop(.34, '#65f5e3'); fire.addColorStop(1, 'rgba(69,128,255,0)');
        ctx.fillStyle = fire; ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(0, 15 + flame); ctx.lineTo(6, 12); ctx.closePath(); ctx.fill();
        ctx.shadowColor = '#65f1e3'; ctx.shadowBlur = 23;
        const hull = ctx.createLinearGradient(-15, -18, 14, 18);
        hull.addColorStop(0, '#edffff'); hull.addColorStop(.34, '#8cf8ef'); hull.addColorStop(.72, '#48aee5'); hull.addColorStop(1, '#987cff');
        ctx.fillStyle = hull;
        ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(7, -7); ctx.lineTo(18, 12); ctx.lineTo(9, 10); ctx.lineTo(5, 18); ctx.lineTo(-5, 18); ctx.lineTo(-9, 10); ctx.lineTo(-18, 12); ctx.lineTo(-7, -7); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#15294a'; ctx.beginPath(); ctx.ellipse(0, -5, 4.4, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -10); ctx.stroke();
        ctx.fillStyle = '#fff1a6'; ctx.beginPath(); ctx.arc(-12, 10, 1.5, 0, Math.PI * 2); ctx.arc(12, 10, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      function render() {
        drawBackground();
        for (const item of pickups) drawPickup(item);
        for (const m of meteors) drawMeteor(m);
        for (const p of particles) {
          ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.35 + .65 * p.life / p.max), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawPlayer();
      }

      function frame(now) {
        const dt = Math.min(.035, (now - lastTime) / 1000 || 0);
        lastTime = now;
        update(dt); render();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      updateHud();
    })();
