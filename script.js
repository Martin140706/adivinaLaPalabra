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

// ── PALABRAS ──
const TODAS_LAS_PALABRAS = [
  "casa",
  "mesa",
  "silla",
  "luna",
  "sol",
  "agua",
  "pan",
  "leche",
  "cafe",
  "te",
  "perro",
  "gato",
  "pato",
  "vaca",
  "oveja",
  "cerdo",
  "caballo",
  "burro",
  "raton",
  "pez",
  "mano",
  "dedo",
  "brazo",
  "pie",
  "cara",
  "ojo",
  "nariz",
  "boca",
  "oreja",
  "pelo",
  "rojo",
  "azul",
  "verde",
  "amarillo",
  "negro",
  "blanco",
  "gris",
  "rosa",
  "lila",
  "marron",
  "dia",
  "noche",
  "tarde",
  "mañana",
  "hoy",
  "ayer",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

// ── ESTADO ──
let preguntaActual = 0;
let puntaje = 0;
let palabrasRonda = [];
let opcionesActuales = [];
let bloqueado = false;
let modoFinal = false;

let faseIntentoLibre = true;
let timeoutOpciones = null;

let reconocimiento = null;

// ── ELEMENTOS ──
const braillePalabra = document.getElementById("braille-palabra");
const opciones = document.getElementById("opciones");
const contadorEl = document.getElementById("contador");
const puntajeEl = document.getElementById("puntaje");
const btnVoz = document.getElementById("btn-voz");
const btnEscuchar = document.getElementById("btn-escuchar");

// ── VOZ ──
function hablar(texto, cancelar = true) {
  const synth = window.speechSynthesis;
  if (cancelar) synth.cancel();

  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "es-AR";
  u.rate = 0.95;
  synth.speak(u);
}

function hablarAsync(texto) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-AR";
    u.rate = 0.95;
    u.onend = resolve;
    window.speechSynthesis.speak(u);
  });
}

// ── UTIL ──
function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── BRAILLE ──
function dibujarBraille(palabra) {
  braillePalabra.innerHTML = "";

  for (const letra of palabra) {
    const puntos = BRAILLE[letra];
    if (!puntos) continue;

    const div = document.createElement("div");
    div.classList.add("braille-letra");

    puntos.forEach((p) => {
      const d = document.createElement("div");
      d.classList.add("punto");
      if (p) d.classList.add("activo");
      div.appendChild(d);
    });

    braillePalabra.appendChild(div);
  }
}

// ── OPCIONES ──
function generarOpciones(correcta) {
  const incorrectas = TODAS_LAS_PALABRAS.filter((p) => p !== correcta)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return mezclar([correcta, ...incorrectas]);
}

function leerOpciones(opts) {
  return opts.map((o, i) => `Opción ${i + 1}, ${o}`).join(". ");
}

// ── BRAILLE VOZ ──
async function describirBraille(palabra) {
  const letras = palabra.split("");

  for (let i = 0; i < letras.length; i++) {
    const puntos = BRAILLE[letras[i]];
    if (!puntos) continue;

    await hablarAsync(`Celda ${i + 1}`);
    await esperar(400);

    const pos = [1, 4, 2, 5, 3, 6];
    const activos = [];

    puntos.forEach((v, i2) => {
      if (v) activos.push(pos[i2]);
    });

    activos.sort((a, b) => a - b);

    for (const p of activos) {
      await hablarAsync(`punto ${p}`);
      await esperar(600);
    }

    await esperar(400);
  }
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

    b.classList.add("opcion");

    b.textContent = `${i + 1}. ${op}`;
    b.onclick = () => elegirOpcion(op, palabra);
    opciones.appendChild(b);
  });

  await describirBraille(palabra);

  hablar("Decí la palabra si la sabés.");

  timeoutOpciones = setTimeout(async () => {
    faseIntentoLibre = false;
    await hablarAsync("Ahora escuchá las opciones.");
    await hablarAsync(leerOpciones(opcionesActuales));
  }, 5000);
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
  }, 2000);
}

// ── FIN ──
function terminar() {
  modoFinal = true;
  hablar(`Terminaste con ${puntaje} de 10. Decí sí para jugar de nuevo.`);
}

// ── INICIO ──
function iniciarJuego() {
  window.speechSynthesis.cancel();

  preguntaActual = 0;
  puntaje = 0;
  modoFinal = false;

  palabrasRonda = mezclar(TODAS_LAS_PALABRAS).slice(0, 10);

  mostrarPregunta();
}

// ── VOZ ──
function iniciarReconocimiento() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  reconocimiento = new SR();
  reconocimiento.lang = "es-AR";

  reconocimiento.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase();

    const palabra = palabrasRonda[preguntaActual];

    if (faseIntentoLibre) {
      if (texto.includes(palabra)) {
        clearTimeout(timeoutOpciones);
        elegirOpcion(palabra, palabra);
        return;
      }
    }

    const mapa = { uno: 0, dos: 1, tres: 2, cuatro: 3, 1: 0, 2: 1, 3: 2, 4: 3 };

    for (const k in mapa) {
      if (texto.includes(k)) {
        elegirOpcion(opcionesActuales[mapa[k]], palabra);
        return;
      }
    }

    if (texto.includes("repetir")) {
      mostrarPregunta();
    }
  };

  reconocimiento.start();
}

// ── EVENTOS ──
btnVoz.onclick = iniciarReconocimiento;
btnEscuchar.onclick = () => mostrarPregunta();

window.addEventListener("load", () => {
  iniciarJuego();

  document.body.addEventListener("click", () => {
    window.speechSynthesis.resume(); // desbloquea audio móvil
  });
});
