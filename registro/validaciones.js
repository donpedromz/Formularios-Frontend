// Reglas de validación puras: reciben el valor del campo y los datos del
// formulario, y devuelven un mensaje de error o null si el valor es correcto.

export const requerido =
  (mensaje = 'Este campo es obligatorio.') =>
  (valor) =>
    valor === undefined || valor === null || String(valor).trim() === ''
      ? mensaje
      : null;

export const longitud = (min, max) => (valor) => {
  if (valor.length < min) return `Usa al menos ${min} caracteres.`;
  if (valor.length > max) return `Usa como máximo ${max} caracteres.`;
  return null;
};

export const formatoCorreo = () => (valor) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)
    ? null
    : 'Escribe un correo válido, por ejemplo ana@mail.com.';

export const rangoEntero = (min, max) => (valor) => {
  const numero = Number(valor);
  if (!Number.isInteger(numero)) return 'Escribe un número entero.';
  if (numero < min) return `El valor mínimo es ${min}.`;
  if (numero > max) return `El valor máximo es ${max}.`;
  return null;
};

export const igualA = (otroCampo, mensaje) => (valor, datos) =>
  valor === datos[otroCampo] ? null : mensaje;

export const contrasenaSegura = () => (valor) =>
  /[A-Za-z]/.test(valor) && /\d/.test(valor)
    ? null
    : 'Usa al menos una letra y un número.';

export const formatoTelefono = () => (valor) =>
  valor === '' || /^\+?\d{7,15}$/.test(valor)
    ? null
    : 'Escribe entre 7 y 15 dígitos, sin espacios y con + opcional.';

export const aceptado =
  (mensaje = 'Debes aceptar los términos.') =>
  (valor) =>
    valor === 'on' || valor === true ? null : mensaje;

// Reglas de cada campo del registro.
export const reglas = {
  nombre: [requerido(), longitud(3, 60)],
  email: [requerido(), formatoCorreo()],
  password: [requerido(), longitud(8, 64), contrasenaSegura()],
  confirmar: [
    requerido(),
    igualA('password', 'Las contraseñas no coinciden. Escribe la misma contraseña.'),
  ],
  edad: [requerido(), rangoEntero(18, 120)],
  pais: [requerido('Elige un país.')],
  terminos: [aceptado()],
};

// Devuelve el primer error del campo, o null si no tiene.
export function validarCampo(nombre, datos) {
  for (const regla of reglas[nombre] ?? []) {
    const error = regla(datos[nombre] ?? '', datos);
    if (error) return error;
  }
  return null;
}

// Devuelve un objeto { campo: mensaje } solo con los campos con error.
export function validarFormulario(datos) {
  const errores = {};
  for (const nombre of Object.keys(reglas)) {
    const error = validarCampo(nombre, datos);
    if (error) errores[nombre] = error;
  }
  return errores;
}
