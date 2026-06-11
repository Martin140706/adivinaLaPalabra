// ── ALFABETO BRAILLE ──
const BRAILLE = {
  a: [1, 0, 0, 0, 0, 0],
  b: [1, 0, 1, 0, 0, 0],
  c: [1, 1, 0, 0, 0, 0],
  d: [1, 1, 0, 1, 0, 0],
  e: [1, 0, 0, 1, 0, 0],
  f: [1, 1, 1, 0, 0, 0],
  g: [1, 1, 1, 1, 0, 0],
  h: [1, 0, 1, 1, 0, 0],
  i: [0, 1, 1, 0, 0, 0],
  j: [0, 1, 1, 1, 0, 0],
  k: [1, 0, 0, 0, 1, 0],
  l: [1, 0, 1, 0, 1, 0],
  m: [1, 1, 0, 0, 1, 0],
  n: [1, 1, 0, 1, 1, 0],
  o: [1, 0, 0, 1, 1, 0],
  p: [1, 1, 1, 0, 1, 0],
  q: [1, 1, 1, 1, 1, 0],
  r: [1, 0, 1, 1, 1, 0],
  s: [0, 1, 1, 0, 1, 0],
  t: [0, 1, 1, 1, 1, 0],
  u: [1, 0, 0, 0, 1, 1],
  v: [1, 0, 1, 0, 1, 1],
  w: [0, 1, 1, 1, 0, 1],
  x: [1, 1, 0, 0, 1, 1],
  y: [1, 1, 0, 1, 1, 1],
  z: [1, 0, 0, 1, 1, 1],
};

// ── PALABRAS FÁCILES ──
const TODAS_LAS_PALABRAS = [
  "casa",
  "mesa",
  "luna",
  "sol",
  "agua",
  "pan",
  "gato",
  "perro",
  "mano",
  "ojo",
  "boca",
  "rojo",
  "azul",
  "verde",
  "dia",
  "noche",
];

// ── ESTADO ──
let preguntaActual = 0;
let puntaje = 0;
let palabrasRonda = [];
let opcionesActuales = [];
let bloqueado = false;

let faseIntentoLibre = true;
let timeoutOpciones = null;

let reconocimiento = null;
let escuchando = false;

// ── ELEMENTOS ──
const braillePalabra = document.getElementById("braille-palabra");
const opciones = document.getElementById("opciones");
const contadorEl = document.getElementById("contador");
const puntajeEl = document.getElementById("puntaje");
const btnVoz = document.getElementById("btn-voz");

// ── VOZ ──
function hablar(texto, cancelar = true) {
  const s = window.speechSynthesis;
  if (cancelar) s.cancel();

  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "es-AR";
  u.rate = 0.95;
  s.speak(u);
}

function hablarAsync(texto) {
  return new Promise((res) => {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-AR";
    u.rate = 0.95;
    u.onend = res;
    speechSynthesis.speak(u);
  });
}

// ── UTIL ──
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function mezclar(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

// ── BRAILLE ──
function dibujarBraille(palabra) {
  braillePalabra.innerHTML = "";
  for (const l of palabra) {
    const p = BRAILLE[l];
    const d = document.createElement("div");
    d.classList.add("braille-letra");

    p.forEach((v) => {
      const dot = document.createElement("div");
      dot.classList.add("punto");
      if (v) dot.classList.add("activo");
      d.appendChild(dot);
    });

    braillePalabra.appendChild(d);
  }
}

// ── OPCIONES ──
function generarOpciones(correcta) {
  const inc = TODAS_LAS_PALABRAS.filter((p) => p !== correcta)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return mezclar([correcta, ...inc]);
}

function leerOpciones(o) {
  return o.map((x, i) => `Opción ${i + 1}, ${x}`).join(". ");
}

// ── PREGUNTA ──
async function mostrarPregunta() {
  bloqueado = false;
  faseIntentoLibre = true;

  const palabra = palabrasRonda[preguntaActual];

  contadorEl.textContent = `Pregunta ${preguntaActual + 1} / 10`;
  puntajeEl.textContent = `✅ ${puntaje}`;

  dibujarBraille(palabra);

  opcionesActuales = generarOpciones(palabra);
  opciones.innerHTML = "";

  opcionesActuales.forEach((op, i) => {
    const b = document.createElement("button");
    b.classList.add("opcion"); // 👈 NO romper estética
    b.textContent = `${i + 1}. ${op}`;
    b.onclick = () => elegirOpcion(op, palabra);
    opciones.appendChild(b);
  });

  await hablarAsync("Decí la palabra si la sabés.");

  timeoutOpciones = setTimeout(async () => {
    faseIntentoLibre = false;
    await hablarAsync("Ahora escuchá las opciones.");
    await hablarAsync(leerOpciones(opcionesActuales));
  }, 9000); // ⏱ MÁS TIEMPO
}

// ── ELEGIR ──
function elegirOpcion(elegida, correcta) {
  if (bloqueado) return;
  bloqueado = true;

  if (elegida === correcta) {
    puntaje++;
    hablar("Correcto");
  } else {
    hablar(`Incorrecto. Era ${correcta}`);
  }

  setTimeout(() => {
    preguntaActual++;
    if (preguntaActual < 10) mostrarPregunta();
    else terminar();
  }, 1800);
}

// ── FIN ──
function terminar() {
  hablar(`Terminaste con ${puntaje} de 10.`);
}

// ── INICIO ──
function iniciarJuego() {
  preguntaActual = 0;
  puntaje = 0;
  palabrasRonda = mezclar(TODAS_LAS_PALABRAS).slice(0, 10);

  mostrarPregunta();
}

// ── VOZ ──
function iniciarReconocimiento() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  if (reconocimiento) reconocimiento.stop();

  reconocimiento = new SR();
  reconocimiento.lang = "es-AR";
  reconocimiento.continuous = true;

  reconocimiento.onstart = () => {
    escuchando = true;
    btnVoz.style.background = "red"; // 🔴 escuchando
  };

  reconocimiento.onend = () => {
    escuchando = false;
    btnVoz.style.background = "yellow"; // 🟡 idle
  };

  reconocimiento.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase().trim();
    const palabra = palabrasRonda[preguntaActual];

    // ── intento libre ──
    if (faseIntentoLibre && texto.includes(palabra)) {
      clearTimeout(timeoutOpciones);
      hablar("Correcto");
      elegirOpcion(palabra, palabra);
      return;
    }

    // ── repetir ──
    if (texto.includes("repetir")) {
      mostrarPregunta();
      return;
    }

    // ── opciones ──
    const mapa = { uno: 0, dos: 1, tres: 2, cuatro: 3, 1: 0, 2: 1, 3: 2, 4: 3 };

    for (const k in mapa) {
      if (texto.includes(k)) {
        elegirOpcion(opcionesActuales[mapa[k]], palabra);
        return;
      }
    }

    // fallback
    hablar("Decí repetir o una opción.");
  };

  reconocimiento.start();
}

// ── EVENTOS ──
btnVoz.onclick = iniciarReconocimiento;
window.onload = iniciarJuego;
