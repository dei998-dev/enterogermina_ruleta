// ============================================================
//  game.js — Trivia Ruleta · Game Logic
//  Depends on: audio.js (must be loaded first)
// ============================================================

const QS = [
  { id:0, text:"¿Por qué Enterogermina es un probiótico inteligente?",      
    answers:[
      "Por su combinación única de probióticos que sobreviven a los ácidos gástricos, antibióticos y altas temperaturas, se adaptan y llegan vivos al intestino en donde se multiplican x 1000.",
      "Porque es el probiótico número 1 en el mundo, cada dosis tiene millones de esporas y sobreviven al intestino.",
      "Porque solo Enterogermina tiene una ciencia que la respalda con cientos de estudios que comprueban su eficacia"
    ],   
    correct:0, exp:"Por su combinación única de probióticos que sobreviven a los ácidos gástricos, antibióticos y altas temperaturas, se adaptan y llegan vivos al intestino en donde se multiplican x 1000." },
  { id:1, text:"¿CUÁL ES LA DIFERENCIA DE ENTEROGERMINA VS UN PROBIÓTICO MULTIESPECIES?", 
    answers:[
      "Enterogermina tiene una combinación única de 4 cepas de Bacillus Clausii que se complementan entre sí, con estudios que respaldan su eficacia, mientras que los probióticos con multi especies no tiene estudios y varias especies pueden competir entre sí.",
      "Enterogermina tiene solo una bacteria con 1 sola cepa mientras otros probióticos tienen de una a cuatro especies combinadas siendo más efectivas.",
      "Que los probióticos que ofrecen multiespecies son más eficientes porque las especies no compiten entre ellas."
    ],            
    correct:0, exp:"Enterogermina tiene una combinación única de 4 cepas de Bacillus Clausii que se complementan entre sí, con estudios que respaldan su eficacia, mientras que los probióticos con multi especies no tiene estudios y varias especies pueden competir entre sí." },
  { id:2, text:"¿CUÁL ES EL DIFERENCIAL DE LAS 4 PRESENTACIONES DE ENTEROGERMINA?",         
    answers:[
      "Solo la presentación. Ya que todos tienen el mismo efecto en cuanto a malestares intestinales con concentraciones diferentes.",
      "La presentación varía de acuerdo a la edad de la persona que lo va a ingerir.",
      "La concentración de Bacillus clausii frente a la severidad del malestar intestinal.Enterogermina presenta: Infant : cólico del lactante, 2 Billones : Síntomas leves, 4 Billones : Síntomas moderados, 6 Billones: Síntomas severos."
    ],               
    correct:2, exp:"La concentración de Bacillus clausii frente a la severidad del malestar intestinal.Enterogermina presenta: Infant : cólico del lactante 2 Billones : Síntomas leves, 4 Billones : Síntomas moderados 6 Billones: Síntomas severos." },
  { id:3, text:"¿TODOS LOS BACILLUS CLAUSII SON IGUALES?",     
    answers:[
      "Sí, todos los probióticos que digan “Bacillus clausii” hacen el mismo efecto en el intestino, sin importar el fabricante.",
      "No, aunque te digan lo contrario. Solo Enterogermina con Bacillus clausii y sus 4 cepas específicas tiene evidencia científica de su efectividad, cumple con la cantidad de billones de probióticos que dice su etiqueta y no presenta contaminantes.",
      "Sí. La única diferencia es que cambian el precio dependiendo de la planta donde se producen."
    ],  
    correct:1, exp:"No, aunque te digan lo contrario. Solo Enterogermina con Bacillus clausii y sus 4 cepas específicas tiene evidencia científica de su efectividad, cumple con la cantidad de billones de probióticos que dice su etiqueta y no presenta contaminantes." },
  { id:4, text:"¿QUÉ SON LOS PROBIÓTICOS?",    
    answers:[
      "Microorganismos vivos que afectan el intestino y el estómago.",
      "Bacterias buenas que hacen que el cuerpo genere defensas en el intestino.",
      "Microorganismos vivos o bacterias benéficas que ayudan integralmente a la salud intestinal"
    ],       
    correct:2, exp:"Microorganismos vivos o bacterias benéficas que ayudan integralmente a la salud intestinal" }
];

const COOLDOWN_MS  = 90000;
const SPIN_DUR_MS  = 3400;


// Adjust if your SVG segments don't start at 12 o'clock (0°)
const OFFSET_DEG   = 0;

let state = {
  score: { c: 0, w: 0 },
  done:  new Set(),
  cds:   {},          // questionId → expiry timestamp
  curQ:  null,
  spin:  false,
  correctIdx:   0,   // alternates 0/1 → m_correcto1 / m_correcto2
  incorrectIdx: 0,   // alternates 0/1 → m_incorrecto1 / m_incorrecto2
};

let wheelDeg = 0;

// ── Helpers ──────────────────────────────────────────────────

function totalScore() {
  return Math.max(0, state.score.c * 100 - state.score.w * 25);
}

function availableQuestions() {
  const now     = Date.now();
  const notDone = QS.filter(q => !state.done.has(q.id));
  if (!notDone.length) return [];
  const free = notDone.filter(q => !state.cds[q.id] || now >= state.cds[q.id]);
  if (free.length) return free;
  // All on cooldown — return the one expiring soonest
  notDone.sort((a, b) => (state.cds[a.id] || 0) - (state.cds[b.id] || 0));
  return [notDone[0]];
}

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function updateScoreboard() {
  document.getElementById('sn-c').textContent = state.score.c;
  document.getElementById('sn-w').textContent = state.score.w;
  document.getElementById('sn-t').textContent = totalScore();
}

// ── Curved text (top arc) ────────────────────────────────────

function buildCurvedText() {
  const svg = document.getElementById('curve-svg');
  const txt = "Gira la ruleta para seleccionar tu pregunta";
  const pad = 52, dim = 460 + pad * 2, sc = dim / 2, r = 226 + 26;
  svg.setAttribute('width',  dim);
  svg.setAttribute('height', dim);
  svg.style.width  = dim + 'px';
  svg.style.height = dim + 'px';
  svg.innerHTML = `
    <defs>
      <path id="tp" d="M ${sc - r},${sc} A ${r},${r} 0 0,1 ${sc + r},${sc}"/>
    </defs>
    <text class= "curved-text">
      <textPath href="#tp" startOffset="50%" text-anchor="middle">${txt}</textPath>
    </text>`;
}

// ── Spin ─────────────────────────────────────────────────────

function doSpin() {
  if (state.spin) return;
  const av = availableQuestions();
  if (!av.length) { showFinal(); return; }

  state.spin = true;
  document.getElementById('wheel-btn').classList.add('spinning');
  document.getElementById('smsg').classList.add('show');
  AudioManager.play('spin');

  const target    = av[Math.floor(Math.random() * av.length)];
  const sliceDeg  = 360 / QS.length;
  const idx       = QS.findIndex(q => q.id === target.id);
  const segCenter = OFFSET_DEG + idx * sliceDeg + sliceDeg / 2;
  const targetDeg = -segCenter;

  const startDeg    = wheelDeg;
  const extraSpins  = (6 + Math.floor(Math.random() * 4)) * 360;
  const currentNorm = ((startDeg  % 360) + 360) % 360;
  const targetNorm  = ((targetDeg % 360) + 360) % 360;
  let   delta       = targetNorm - currentNorm;
  if (delta <= 0) delta += 360;
  const endDeg  = startDeg + extraSpins + delta;

  const t0      = performance.now();
  const wheelEl = document.getElementById('wheel');

  function ease(t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2; }

  requestAnimationFrame(function tick(now) {
    const t   = Math.min((now - t0) / SPIN_DUR_MS, 1);
    const cur = startDeg + (endDeg - startDeg) * ease(t);
    wheelEl.style.transform = `translate(-50%,-50%) rotate(${cur}deg)`;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      wheelDeg = endDeg;
      wheelEl.style.transform = `translate(-50%,-50%) rotate(${wheelDeg}deg)`;
      state.spin = false;
      document.getElementById('wheel-btn').classList.remove('spinning');
      document.getElementById('smsg').classList.remove('show');
      AudioManager.stop('spin');
      AudioManager.play('tick');
      state.curQ = target;
      setTimeout(() => showQuestion(target), 350);
    }
  });
}

// ── Question screen ──────────────────────────────────────────

function showQuestion(q) {
  const answered = state.score.c + state.score.w;
  document.getElementById('qtag').textContent = `Pregunta ${q.id + 1}`;
  document.getElementById('qsc').textContent  = `Puntaje: ${totalScore()}`;
  document.getElementById('qtxt').textContent = q.text;

  const list = document.getElementById('alist');
  list.innerHTML = '';
  q.answers.forEach((a, i) => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.innerHTML = `${a}`;
    btn.onclick = () => pickAnswer(i);
    list.appendChild(btn);
  });

  const pct = Math.round((answered / QS.length) * 100);
  document.getElementById('pbar').style.width = Math.max(8, pct) + '%';
  document.getElementById('plbl').textContent = `${answered + 1} / ${QS.length}`;
  goTo('s-question');
}

function pickAnswer(idx) {
  if (!state.curQ) return;
  const q    = state.curQ;
  const btns = document.querySelectorAll('.ans-btn');
  btns.forEach(b => b.disabled = true);

  const correct = idx === q.correct;
  btns[idx].classList.add(correct ? 'correct' : 'wrong');
  if (!correct) btns[q.correct].classList.add('correct');

  setTimeout(() => {
    if (correct) {
      state.score.c++;
      state.done.add(q.id);
      // Apply cooldown so the next person gets a different question
      state.cds[q.id] = Date.now() + COOLDOWN_MS;
      document.getElementById('c-atxt').textContent = q.answers[q.correct];
      document.getElementById('c-exp').textContent  = q.exp;
      /*updateScoreboard();*/
      AudioManager.play('correct');
      // Alternate correct character image
      const cNum = state.correctIdx % 2 + 1;
      document.querySelector('.character_3 img').src = `imgs/m_correcto${cNum}.webp`;
      state.correctIdx++;
      goTo('s-correct');
      // Auto-advance to final screen after 5 seconds
      clearTimeout(state._correctTimer);
      state._correctTimer = setTimeout(showFinal, 5000);
    } else {
      state.score.w++;
      state.cds[q.id] = Date.now() + COOLDOWN_MS;
      document.getElementById('w-atxt').textContent = q.answers[q.correct];
      document.getElementById('w-exp').textContent  = q.exp;
      /*updateScoreboard();*/
      AudioManager.play('wrong');
      // Alternate incorrect character image
      const wNum = state.incorrectIdx % 2 + 1;
      document.querySelector('.character_4 img').src = `imgs/m_incorrecto${wNum}.webp`;
      state.incorrectIdx++;
      goTo('s-incorrect');
      // Auto-advance to roulette after 10 seconds
      clearTimeout(state._incorrectTimer);
      state._incorrectTimer = setTimeout(goRoulette, 10000);
    }
  }, 600);
}

// ── Navigation ───────────────────────────────────────────────

function goRoulette() {
  /*updateScoreboard();*/
  clearTimeout(state._incorrectTimer);
  clearTimeout(state._correctTimer);
  goTo('s-roulette');
}

function showFinal() {
  clearTimeout(state._correctTimer);
  clearTimeout(state._incorrectTimer);
 /* document.getElementById('f-c').textContent = state.score.c;
  document.getElementById('f-w').textContent = state.score.w;
  document.getElementById('f-t').textContent = totalScore();*/
  goTo('s-final');
}

// ── Sound toggle ─────────────────────────────────────────────

function toggleSound() {
  const muted = AudioManager.toggleMute();
  const btn   = document.getElementById('sound-btn');
  btn.textContent = muted ? 'Sonido: OFF' : 'Sonido: ON';
  btn.classList.toggle('sound-off', muted);
}

// ── Reset ────────────────────────────────────────────────────

function resetGame() {
  clearTimeout(state._correctTimer);
  clearTimeout(state._incorrectTimer);
  state   = { score:{ c:0, w:0 }, done: new Set(), cds:{}, curQ: null, spin: false, correctIdx: 0, incorrectIdx: 0 };
  wheelDeg = 0;
  document.getElementById('wheel').style.transform = 'translate(-50%,-50%) rotate(0deg)';
  document.getElementById('wheel-btn').classList.remove('spinning');
  /*updateScoreboard();*/
  goTo('s-roulette');
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  AudioManager.init();
  buildCurvedText();
  /*updateScoreboard();*/
});