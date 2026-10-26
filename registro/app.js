import {
  formatoTelefono,
  validarCampo,
  validarFormulario,
  reglas,
} from './validaciones.js';

const reglaTelefono = formatoTelefono();

const form = document.querySelector('#registro');
const boton = form.querySelector('button[type="submit"]');
const mensaje = document.querySelector('#mensaje');
const saludo = document.querySelector('#saludo');
const lista = document.querySelector('#telefonos');
const agregar = document.querySelector('#agregar-telefono');

const MAX_TELEFONOS = 3;
let contadorTelefonos = 0;
let enviando = false;
let revisionCorreo = 0;

// Correos que el servidor simulado considera ya registrados.
const registrados = ['ana@mail.com', 'admin@mail.com'];

const correoDisponible = (email) =>
  new Promise((resolver) =>
    setTimeout(
      () => resolver(!registrados.includes(email.toLowerCase())),
      600,
    ),
  );

// Lee todos los campos y agrupa los teléfonos en un array.
function leerDatos() {
  const datos = new FormData(form);
  return {
    ...Object.fromEntries(datos),
    telefono: datos
      .getAll('telefono')
      .map((telefono) => telefono.trim())
      .filter(Boolean),
  };
}

// Muestra u oculta el mensaje de un campo y actualiza aria-invalid.
function mostrarError(id, texto, tipo = 'error') {
  const campo = form.elements[id];
  const caja = document.getElementById(`${id}-error`);

  if (campo) {
    const esError = Boolean(texto) && tipo === 'error';
    campo.setAttribute('aria-invalid', esError ? 'true' : 'false');
  }

  if (caja) {
    caja.textContent = texto ?? '';
    caja.classList.toggle('aviso', Boolean(texto) && tipo === 'aviso');
  }
}

function limpiarErrores() {
  for (const caja of form.querySelectorAll('.error')) {
    caja.textContent = '';
    caja.classList.remove('aviso');
  }
  for (const campo of form.querySelectorAll('input, select')) {
    campo.setAttribute('aria-invalid', 'false');
  }
}

// Valida todos los teléfonos agregados.
function validarTelefonos() {
  for (const campo of lista.querySelectorAll('input[name="telefono"]')) {
    mostrarError(campo.id, reglaTelefono(campo.value.trim()));
  }
}

// Espera a que la persona deje de escribir antes de ejecutar la función.
function debounce(fn, ms) {
  let espera;
  const envuelta = (...args) => {
    clearTimeout(espera);
    espera = setTimeout(() => fn(...args), ms);
  };
  envuelta.cancelar = () => clearTimeout(espera);
  return envuelta;
}

// Consulta si el correo está libre y muestra el resultado.
async function comprobarCorreo(email) {
  const turno = ++revisionCorreo;
  mostrarError('email', 'Comprobando disponibilidad…', 'aviso');

  const libre = await correoDisponible(email.toLowerCase());
  if (turno !== revisionCorreo) return libre;

  mostrarError(
    'email',
    libre ? null : 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?',
  );
  return libre;
}

// Revisa el formato y, si es correcto, la disponibilidad del correo.
const revisarCorreo = debounce((email) => {
  // El formato se avisa al salir del campo, no mientras se escribe.
  if (validarCampo('email', { email })) return;

  comprobarCorreo(email);
}, 500);

form.elements.email.addEventListener('input', (evento) => {
  // Invalida cualquier consulta anterior que todavía esté en curso.
  revisionCorreo += 1;
  mostrarError('email', null);
  revisarCorreo(evento.target.value.trim());
});

// Valida cada campo cuando pierde el foco.
form.addEventListener('focusout', (evento) => {
  const campo = evento.target;
  if (!campo.name) return;

  const datos = leerDatos();

  if (campo.name === 'telefono') {
    mostrarError(campo.id, reglaTelefono(campo.value.trim()));
    return;
  }

  if (campo.name === 'email') {
    const error = validarCampo('email', datos);
    if (error) mostrarError('email', error);
    return;
  }

  if (campo.name === 'password') {
    mostrarError('password', validarCampo('password', datos));
    if (datos.confirmar) {
      mostrarError('confirmar', validarCampo('confirmar', datos));
    }
    return;
  }

  if (reglas[campo.name]) {
    mostrarError(campo.name, validarCampo(campo.name, datos));
  }
});

// Actualiza de inmediato los campos que se eligen con un clic.
form.elements.pais.addEventListener('change', () => {
  mostrarError('pais', validarCampo('pais', leerDatos()));
});

form.elements.terminos.addEventListener('change', () => {
  mostrarError('terminos', validarCampo('terminos', leerDatos()));
});

// Crea una fila de teléfono con su etiqueta, campo y botón para quitarla.
function crearTelefono() {
  if (lista.children.length >= MAX_TELEFONOS) return;

  contadorTelefonos += 1;
  const n = contadorTelefonos;
  const fila = document.createElement('div');
  fila.className = 'fila-telefono';

  // El contenido es fijo; el único valor interpolado lo genera este código.
  fila.innerHTML = `
    <label for="tel-${n}">Teléfono ${n}</label>
    <div class="campo-telefono">
      <input
        id="tel-${n}"
        name="telefono"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="+573001234567"
        aria-describedby="tel-${n}-error"
      />
      <button type="button" class="quitar" aria-label="Quitar teléfono ${n}">
        Quitar
      </button>
    </div>
    <p id="tel-${n}-error" class="error" aria-live="polite"></p>
  `;

  lista.append(fila);
  actualizarBotonAgregar();
  fila.querySelector('input').focus();
}

// Deja los teléfonos numerados de forma consecutiva después de quitar uno.
function renumerarTelefonos() {
  [...lista.children].forEach((fila, indice) => {
    const n = indice + 1;
    const input = fila.querySelector('input');
    const label = fila.querySelector('label');
    const error = fila.querySelector('.error');
    const quitar = fila.querySelector('.quitar');

    input.id = `tel-${n}`;
    input.setAttribute('aria-describedby', `tel-${n}-error`);
    label.htmlFor = `tel-${n}`;
    label.textContent = `Teléfono ${n}`;
    error.id = `tel-${n}-error`;
    quitar.setAttribute('aria-label', `Quitar teléfono ${n}`);
  });

  contadorTelefonos = lista.children.length;
}

function actualizarBotonAgregar() {
  agregar.disabled = lista.children.length >= MAX_TELEFONOS;
}

function vaciarTelefonos() {
  lista.replaceChildren();
  contadorTelefonos = 0;
  actualizarBotonAgregar();
}

agregar.addEventListener('click', crearTelefono);

// Un solo listener atiende los botones «Quitar» de todas las filas.
lista.addEventListener('click', (evento) => {
  const quitar = evento.target.closest('.quitar');
  if (!quitar) return;

  quitar.closest('.fila-telefono').remove();
  renumerarTelefonos();
  actualizarBotonAgregar();
  agregar.focus();
});

function reiniciarFormulario() {
  revisarCorreo.cancelar();
  revisionCorreo += 1;
  form.reset();
  vaciarTelefonos();
  limpiarErrores();
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviando) return;

  mensaje.textContent = '';
  mensaje.removeAttribute('data-estado');
  saludo.textContent = '';

  const datos = leerDatos();
  const errores = validarFormulario(datos);

  for (const nombre of Object.keys(reglas)) {
    mostrarError(nombre, errores[nombre] ?? null);
  }
  validarTelefonos();

  const primerError = form.querySelector('[aria-invalid="true"]');
  if (primerError) {
    primerError.focus();
    return;
  }

  enviando = true;
  boton.disabled = true;
  boton.textContent = 'Enviando…';

  try {
    revisarCorreo.cancelar();

    const libre = await comprobarCorreo(datos.email.trim());
    if (!libre) {
      form.elements.email.focus();
      return;
    }

    const cuerpo = {
      ...datos,
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      edad: Number(datos.edad),
      terminos: form.elements.terminos.checked,
    };
    delete cuerpo.confirmar;

    const respuesta = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const creado = await respuesta.json();
    mensaje.textContent = `¡Cuenta creada! Id: ${creado.id}`;
    mensaje.dataset.estado = 'exito';
    saludo.textContent = `Hola, ${cuerpo.nombre}`;
    reiniciarFormulario();
  } catch (error) {
    console.error(error);
    mensaje.textContent =
      'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
    mensaje.dataset.estado = 'error';
  } finally {
    enviando = false;
    boton.disabled = false;
    boton.textContent = 'Crear cuenta';
  }
});
