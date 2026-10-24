# Formularios Frontend

### ¿Qué pasa si borras el atributo `name` de un campo y envías? ¿Por qué?

Si borras el `name`, ese campo **desaparece del envío**: el servidor nunca lo recibe.

La razón es que el navegador envía los datos como pares `name=valor`, y el `name`
es la etiqueta con la que se identifica cada dato. Sin etiqueta, el campo no
sabe "cómo llamarse" y queda fuera del formulario, aunque el usuario lo haya
llenado.

El `id`, en cambio, solo sirve para conectar la etiqueta con el campo y para
los estilos y los scripts: no juega ningún papel al enviar el formulario.
