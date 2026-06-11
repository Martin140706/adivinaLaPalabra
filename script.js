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
  "año",
  "mes",
  "hora",
  "minuto",
  "segundo",
  "tiempo",
  "vida",
  "playa",
  "mar",
  "rio",
  "lago",
  "isla",
  "montaña",
  "bosque",
  "campo",
  "arena",
  "piedra",
  "auto",
  "tren",
  "avion",
  "barco",
  "bus",
  "moto",
  "bicicleta",
  "camion",
  "taxi",
  "metro",
  "libro",
  "hoja",
  "lápiz",
  "cuaderno",
  "puerta",
  "ventana",
  "pared",
  "techo",
  "piso",
  "juego",
  "pelota",
  "correr",
  "saltar",
  "caminar",
  "leer",
  "escribir",
  "dibujar",
  "hablar",
  "escuchar",
];

// ── ESTADO ──
let preguntaActual = 0;
let puntaje = 0;
let palabrasRonda = [];
let opcionesActuales = [];
let bloqueado = false;
let reconocimiento = null;
let escuchando = false;
let modoFinal = false;

// ── ELEMENTOS ──
const braillePalabra = document.getElementById("braille-palabra");
const opciones = document.getElementById("opciones");
const contadorEl = document.getElementById("contador");
const puntajeEl = document.getElementById("puntaje");
const btnVoz = document.getElementById("btn-voz");
const btnEscuchar = document.getElementById("btn-escuchar");

// ── UTIL ──
function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

// ── MEZCLAR ──
function mezclar(arr) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ── DIBUJAR BRAILLE ──
function dibujarBraille(palabra) {
  braillePalabra.innerHTML = "";

  for (const letra of palabra) {
    const puntos = BRAILLE[letra];
    if (!puntos) continue;

    const div = document.createElement("div");
    div.classList.add("braille-letra");

    puntos.forEach((activo) => {
      const punto = document.createElement("div");
      punto.classList.add("punto");
      if (activo) punto.classList.add("activo");
      div.appendChild(punto);
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
  return opts.map((op, i) => `Opción ${i + 1}, ${op}`).join(". ");
}

// ── BRAILLE CON VOZ (CORREGIDO) ──
async function describirBraille(palabra) {
  const letras = palabra.split("");

  for (let i = 0; i < letras.length; i++) {
    const letra = letras[i];
    const puntos = BRAILLE[letra];
    if (!puntos) continue;

    const ordinal =
      ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta"][i] ||
      `Celda ${i + 1}`;

    await hablarAsync(`${ordinal} celda.`);
    await esperar(400);

    const posiciones = [1, 4, 2, 5, 3, 6];

    const activos = [];

    for (let j = 0; j < puntos.length; j++) {
      if (puntos[j]) {
        activos.push(posiciones[j]);
      }
    }

    // 🔥 ORDENADOS
    activos.sort((a, b) => a - b);

    for (let k = 0; k < activos.length; k++) {
      await hablarAsync(`${activos[k]}.`);
      await esperar(600);
    }

    await esperar(500);
  }
}

// ── PREGUNTA ──
async function mostrarPregunta() {
  bloqueado = false;

  const palabra = palabrasRonda[preguntaActual];

  contadorEl.textContent = `Pregunta ${preguntaActual + 1} / 10`;
  puntajeEl.textContent = `✅ ${puntaje}`;

  dibujarBraille(palabra);

  opcionesActuales = generarOpciones(palabra);
  opciones.innerHTML = "";

  opcionesActuales.forEach((opcion, i) => {
    const btn = document.createElement("button");
    btn.classList.add("opcion");
    btn.textContent = `${i + 1}. ${opcion}`;
    btn.addEventListener("click", () => elegirOpcion(opcion, palabra));
    opciones.appendChild(btn);
  });

  await describirBraille(palabra);

  await hablarAsync(leerOpciones(opcionesActuales));
}

// ── ELEGIR ──
function elegirOpcion(elegida, correcta) {
  if (bloqueado) return;
  bloqueado = true;

  const botones = document.querySelectorAll(".opcion");

  botones.forEach((btn) => {
    const txt = btn.textContent.split(". ")[1];
    if (txt === correcta) btn.classList.add("correcta");
    else if (txt === elegida) btn.classList.add("incorrecta");
  });

  if (elegida === correcta) {
    puntaje++;
    puntajeEl.textContent = `✅ ${puntaje}`;
    hablar("Correcto");
  } else {
    hablar(`Incorrecto. Era ${correcta}`);
  }

  setTimeout(() => {
    preguntaActual++;
    if (preguntaActual < 10) mostrarPregunta();
    else terminarJuego();
  }, 2000);
}

// ── FIN ──
function terminarJuego() {
  modoFinal = true;
  hablar(`Terminaste con ${puntaje} de 10. Decí sí para jugar de nuevo.`);
}

// ── INICIO ──
function iniciarJuego() {
  window.speechSynthesis.cancel();

  preguntaActual = 0;
  puntaje = 0;
  modoFinal = false;
  bloqueado = false;

  palabrasRonda = mezclar(TODAS_LAS_PALABRAS).slice(0, 10);

  puntajeEl.textContent = "✅ 0";
  mostrarPregunta();
}

// ── VOZ ──
function iniciarReconocimiento() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return hablar("No soporta voz");

  if (escuchando) return reconocimiento.stop();

  reconocimiento = new SR();
  reconocimiento.lang = "es-AR";

  reconocimiento.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase();

    if (modoFinal) {
      if (texto.includes("si") || texto.includes("sí")) iniciarJuego();
      else hablar("Decí sí");
      return;
    }

    const mapa = {
      "opción 1": 0,
      opcion1: 0,
      uno: 0,
      1: 0,
      "opción 2": 1,
      opcion2: 1,
      dos: 1,
      2: 1,
      "opción 3": 2,
      opcion3: 2,
      tres: 2,
      3: 2,
      "opción 4": 3,
      opcion4: 3,
      cuatro: 3,
      4: 4,
    };

    for (const [k, v] of Object.entries(mapa)) {
      if (texto.includes(k)) {
        elegirOpcion(opcionesActuales[v], palabrasRonda[preguntaActual]);
        return;
      }
    }

    const encontrada = opcionesActuales.find((o) => texto.includes(o));

    if (encontrada) {
      elegirOpcion(encontrada, palabrasRonda[preguntaActual]);
      return;
    }

    hablar("No entendí");
  };

  reconocimiento.start();
}

// ── EVENTOS ──
btnVoz.addEventListener("click", iniciarReconocimiento);

btnEscuchar.addEventListener("click", async () => {
  const palabra = palabrasRonda[preguntaActual];
  await describirBraille(palabra);
  await hablarAsync(leerOpciones(opcionesActuales));
});

window.addEventListener("load", iniciarJuego);
