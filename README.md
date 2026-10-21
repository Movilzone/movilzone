# Movil Zone / Apple Zone

Web pública: https://movilzone.github.io/movilzone/ . Catálogo y consultas por WhatsApp. GitHub Pages sirve archivos estáticos; no ejecuta `/api/catalog`.

## Datos y actualización

La fuente de precios es LISTA EQUIPOS, exclusivamente Hoja 3 A:H, leída en modo público sin modificar la planilla ni sus permisos. Son valores finales de venta: no agregar márgenes ni usar costos.

Ejecutar desde la raíz `python scripts/sync-catalog.py` con Python 3 y Node.js 22 o superior. El comando valida la fuente, actualiza `data/catalog.json` cuando cambia y regenera `data/catalog-fallback.js` para mantener idénticos precios con o sin fetch. Si la fuente falla, no reemplaza el catálogo.

Los cambios deben guardarse en la rama que publica GitHub Pages. La tarea de mantenimiento de ChatGPT revisa el repositorio tres veces al día a las 9:30, 13:30 y 17:30 de Argentina. Es una tarea externa, no un cron interno de GitHub. El navegador consulta el catálogo publicado cada minuto y al volver a la pestaña; esto no consulta directamente la planilla.

## Archivos

- `index.html`: estructura de la página.
- `assets/styles.css` y `assets/app.js`: diseño y funcionamiento.
- `config.json`: contacto y ruta relativa del catálogo.
- `data/product-images.json`: fotos verificadas por color.
- `data/model-images.json`: fotos por modelo.
- `scripts/live-catalog.mjs`: lector de la lista pública y ofertas vigentes.
- `MAINTENANCE.md`: instrucciones de mantenimiento.

Pruebas: `node --test tests/*.test.mjs`. Validación de JavaScript: `node --check assets/app.js`.

Logo original: `assets/logo-movil-zone.png`; no redibujarlo. El favicon SVG lo incorpora y aplica un recorte circular transparente. No usar un cuadrado blanco como icono de pestaña.
