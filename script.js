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
let ultimaPalabra = "";
let esperandoDecision = false;

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
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(texto);

    u.lang = "es-AR";
    u.rate = 0.95;

    u.onend = () => {
      resolve();
    };

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
async function describirBraille(palabra) {
  ultimaPalabra = palabra;

  const letras = palabra.split("");

  for (let i = 0; i < letras.length; i++) {
    const letra = letras[i];

    const puntos = BRAILLE[letra];
    if (!puntos) continue;

    let nombreCelda;

    switch (i) {
      case 0:
        nombreCelda = "Primera";
        break;
      case 1:
        nombreCelda = "Segunda";
        break;
      case 2:
        nombreCelda = "Tercera";
        break;
      case 3:
        nombreCelda = "Cuarta";
        break;
      case 4:
        nombreCelda = "Quinta";
        break;
      case 5:
        nombreCelda = "Sexta";
        break;
      default:
        nombreCelda = `Celda ${i + 1}`;
    }

    await hablarAsync(`${nombreCelda} celda`);

    await esperar(1000);

    const posiciones = [1, 4, 2, 5, 3, 6];

    const activos = [];

    for (let j = 0; j < puntos.length; j++) {
      if (puntos[j]) {
        activos.push(posiciones[j]);
      }
    }

    activos.sort((a, b) => a - b);

    for (const punto of activos) {
      await hablarAsync(`${punto}`);
      await esperar(100);
    }

    await esperar(500);
  }
}

async function repetirCelda(numeroCelda) {
  const palabra = palabrasRonda[preguntaActual];

  const letra = palabra[numeroCelda - 1];

  if (!letra) {
    hablar("Esa celda no existe");
    return;
  }

  const puntos = BRAILLE[letra];

  const posiciones = [1, 4, 2, 5, 3, 6];

  let activos = [];

  for (let i = 0; i < puntos.length; i++) {
    if (puntos[i]) {
      activos.push(posiciones[i]);
    }
  }

  activos.sort((a, b) => a - b);

  await hablarAsync(`Celda ${numeroCelda}`);

  for (const punto of activos) {
    await hablarAsync(`${punto}`);
    await esperar(600);
  }
}
// ── PREGUNTA ──
async function mostrarPregunta() {
  clearTimeout(timeoutOpciones);
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

  await describirBraille(palabra);

  await hablarAsync("Decí la palabra si la sabés.");

  timeoutOpciones = setTimeout(async () => {
    faseIntentoLibre = false;
    await hablarAsync("Ahora escuchá las opciones.");
    await hablarAsync(leerOpciones(opcionesActuales));
  }, 15000); // ⏱ MÁS TIEMPO
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

  if (!SR) {
    hablar("Tu navegador no soporta reconocimiento de voz");
    return;
  }

  if (escuchando) {
    reconocimiento.stop();
    return;
  }

  reconocimiento = new SR();

  reconocimiento.lang = "es-AR";
  reconocimiento.continuous = false;
  reconocimiento.interimResults = false;

  reconocimiento.onstart = () => {
    escuchando = true;
    btnVoz.classList.add("escuchando");
  };

  reconocimiento.onend = () => {
    escuchando = false;
    btnVoz.classList.remove("escuchando");
  };

  reconocimiento.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase().trim();

    console.log("Escuché:", texto);
    const palabra = palabrasRonda[preguntaActual];

    if (faseIntentoLibre) {
      clearTimeout(timeoutOpciones);

      if (texto.includes(palabra)) {
        elegirOpcion(palabra, palabra);
        return;
      }

      if (texto.includes("opciones")) {
        faseIntentoLibre = false;
        hablar(leerOpciones(opcionesActuales));
        return;
      }

      if (texto.includes("repetir celda")) {
        let numero = null;

        if (texto.includes("uno")) numero = 1;
        else if (texto.includes("dos")) numero = 2;
        else if (texto.includes("tres")) numero = 3;
        else if (texto.includes("cuatro")) numero = 4;
        else if (texto.includes("cinco")) numero = 5;
        else if (texto.includes("seis")) numero = 6;

        const match = texto.match(/\d+/);

        if (!numero && match) {
          numero = parseInt(match[0]);
        }

        if (numero) {
          repetirCelda(numero);
        } else {
          hablar("Decí repetir celda uno, dos, tres, cuatro, cinco o seis");
        }

        return;
      }

      if (texto === "repetir") {
        mostrarPregunta();
        return;
      }

      hablar(
        "No es correcto. Decí opciones para escuchar las respuestas o repetir para escuchar nuevamente.",
      );

      return;
    }

    if (texto.includes("repetir celda")) {
      let numero = null;

      if (texto.includes("uno")) numero = 1;
      else if (texto.includes("dos")) numero = 2;
      else if (texto.includes("tres")) numero = 3;
      else if (texto.includes("cuatro")) numero = 4;
      else if (texto.includes("cinco")) numero = 5;
      else if (texto.includes("seis")) numero = 6;

      const match = texto.match(/\d+/);

      if (!numero && match) {
        numero = parseInt(match[0]);
      }

      if (numero) {
        repetirCelda(numero);
      } else {
        hablar(
          "No entendí. Podés decir una palabra, repetir, repetir celda o una opción.",
        );
      }

      return;
    }

    // Si dijo alguna palabra de las opciones
    for (const opcion of opcionesActuales) {
      if (texto.includes(opcion.toLowerCase())) {
        clearTimeout(timeoutOpciones);

        elegirOpcion(opcion, palabra);
        return;
      }
    }
    if (texto === "repetir") {
      mostrarPregunta();
      return;
    }

    if (texto.includes("repetir")) {
      mostrarPregunta();
      return;
    }

    const mapa = {
      uno: 0,
      dos: 1,
      tres: 2,
      cuatro: 3,
      1: 0,
      2: 1,
      3: 2,
      4: 3,
    };

    for (const k in mapa) {
      if (texto.includes(k)) {
        elegirOpcion(opcionesActuales[mapa[k]], palabra);
        return;
      }
    }

    if (faseIntentoLibre) {
      hablar(
        "No es correcto. Decí repetir para escuchar nuevamente o opciones para escuchar las respuestas.",
      );
    } else {
      hablar("Decí uno, dos, tres o cuatro.");
    }
  };

  reconocimiento.start();
}

// ── EVENTOS ──
btnVoz.onclick = iniciarReconocimiento;
window.onload = iniciarJuego;
