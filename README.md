# Formulario de registro

Formulario de registro hecho con HTML, CSS y JavaScript, sin librerías ni frameworks. Incluye validación de los siete campos, mensajes de error accesibles, envío con `fetch`, comprobación asíncrona del correo y teléfonos dinámicos.

## Cómo ejecutarlo

La versión de `registro/` usa módulos de JavaScript, así que necesita un servidor local. Con VS Code y Live Server, abre `registro/index.html` con «Open with Live Server». También puedes ejecutar `npx serve .` en la raíz del repositorio y entrar a `http://localhost:3000/registro/`.

La versión de `nativo/` funciona con la validación del navegador y se puede abrir directamente con doble clic.

## Estructura

- `index.html`: portada con enlaces a las dos versiones.
- `nativo/index.html`: formulario con validación nativa del navegador.
- `registro/index.html`: formulario completo.
- `registro/estilos.css`: estilos y estados de error.
- `registro/app.js`: eventos, envío, teléfonos y comprobación del correo.
- `registro/validaciones.js`: reglas de validación puras.

## Preguntas

### ¿Qué pasa si se borra el atributo `name` de un campo y se envía el formulario? ¿Por qué?

El campo sigue visible y el navegador puede seguir validándolo, pero deja de enviarse. El atributo `name` es la clave con la que se construyen los pares `nombre=valor` del formulario. Sin `name`, ese control no forma parte de `FormData` y tampoco aparece en el cuerpo del envío nativo.

El `id` no reemplaza esa función: sirve para el `label`, el CSS y `getElementById`, pero no para enviar datos. Por eso el servidor recibe el formulario incompleto y, si el campo era obligatorio, debe rechazar la petición.

### ¿Qué diferencia hay entre `:invalid` y `:user-invalid`? ¿Cuál conviene más y por qué?

`:invalid` se aplica en cuanto la página carga a todos los campos obligatorios que están vacíos, aunque la persona todavía no haya interactuado con ellos. El formulario aparece marcado en rojo desde el primer segundo.

`:user-invalid` solo se activa después de que la persona interactuó con el campo (por ejemplo, al salir de él) o intentó enviar el formulario. Conviene más `:user-invalid` porque muestra el error cuando ya hay una acción que corregir y no acusa a la persona antes de que empiece.

En este formulario el estado se controla con `aria-invalid` desde JavaScript, que permite la misma idea: marcar el error después de la interacción, al salir del campo o al intentar enviar. Además, `aria-invalid` comunica el estado a los lectores de pantalla.

### ¿Por qué se escucha el evento `submit` del formulario y no el `click` del botón?

Porque un formulario se puede enviar de varias formas: con un clic en el botón, con la tecla Enter dentro de un campo, con un lector de pantalla o con `form.requestSubmit()`. El evento `submit` se dispara en todos esos casos; el `click` del botón solo cubre el clic.

Escuchar `submit` centraliza la validación y el envío en un solo lugar, y permite usar `preventDefault()` para enviar con `fetch` sin recargar la página. Si se escuchara solo el clic, el envío con Enter seguiría el camino nativo y recargaría la página.

### ¿Qué ventaja tiene que las reglas de validación sean funciones puras?

Una función pura depende solo de sus argumentos y no modifica nada fuera de ella: con el mismo valor de entrada devuelve siempre el mismo resultado. Eso permite probarlas por separado sin abrir el navegador, reutilizarlas en otro formulario o incluso en el servidor, y combinarlas sin efectos secundarios.

También hacen que el código sea más fácil de leer y de cambiar: las reglas y los mensajes están en un solo archivo, y `app.js` solo se encarga de mostrar los resultados.

### ¿Por qué la comprobación «el correo ya existe» no se puede resolver solo con atributos HTML?

Porque los atributos HTML validan propiedades que el navegador conoce por sí mismo: si el campo está vacío, si el texto tiene formato de correo, si un número está dentro de un rango o si un checkbox está marcado. Que un correo ya esté registrado es un dato que vive en la base de datos del servidor.

El navegador no tiene acceso a esa información ni puede consultarla de forma síncrona. Por eso hace falta una petición asíncrona, esperar la respuesta y manejarla en la interfaz. El servidor sigue siendo la fuente de verdad: la comprobación en el cliente es una ayuda, no una garantía.

### ¿Qué demuestra poder enviar datos inválidos saltándose el formulario y qué debe hacer el backend?

Demuestra que la validación del navegador es una ayuda para la persona que usa el formulario, no una barrera de seguridad. Cualquiera puede abrir DevTools, borrar `min` y `max`, cambiar el HTML o enviar una petición con `fetch` directamente, sin pasar por los controles. Al borrar `min` y `max` del campo Edad de la versión nativa y enviar `5`, la petición llega al servidor. Lo mismo ocurre con una petición hecha desde la consola:

```js
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'no-es-correo', edad: -3 }),
})
  .then((respuesta) => respuesta.json())
  .then(console.log);
```

El backend debe revalidar todos los datos con el mismo esquema o uno más estricto, rechazar lo que no cumpla y no confiar en nada que venga del cliente. Además debe usar consultas parametrizadas o sentencias preparadas. En una consulta parametrizada el texto SQL y los valores viajan por separado:

```js
db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
```

La estructura de la consulta es fija y el valor se envía aparte, así que un texto como `' OR '1'='1` se trata como un correo literal y nunca se ejecuta como código. Eso evita la inyección SQL. También conviene usar un usuario de base de datos con permisos mínimos y codificar la salida.

### ¿Qué diferencia hay entre `innerHTML` y `textContent` al mostrar datos escritos por el usuario?

`innerHTML` interpreta la cadena como HTML. Si el nombre es `<b>Ana</b>`, el navegador crea un elemento `<b>` y se ve **Ana** en negrita. Si el texto incluye algo como `<img src=x onerror="alert(1)">`, el navegador intenta cargar la imagen y ejecuta el código: es una puerta para XSS.

`textContent` inserta la cadena como texto plano. `<b>Ana</b>` se ve tal cual, con los signos `<` y `>`, y no se crea ningún elemento ni se ejecuta nada.

En este código el saludo usa `textContent`. El único `innerHTML` está en la plantilla de los teléfonos, y solo interpola un número que genera el propio código; no recibe texto de la persona. Los nombres, correos y demás datos se muestran siempre con `textContent`.

## Prueba de usabilidad

| Observación | Campo | Problema | Corrección aplicada |
| --- | --- | --- | --- |
| Al enviar con varios errores, el foco seguía en el botón y no era evidente cuál corregir primero. | Todos | La persona tenía que buscar el primer error entre varios campos. | Se muestran todos los mensajes a la vez y el foco pasa al primer campo con `aria-invalid="true"`. |
| Al quitar una fila con el teclado, el foco se perdía y no se sabía dónde continuar. | Teléfonos | Los botones «Quitar» no tenían un nombre accesible ni un foco visible claro. | El foco vuelve al botón «Agregar teléfono»; los botones «Quitar» tienen `aria-label` y un anillo de foco visible. |
