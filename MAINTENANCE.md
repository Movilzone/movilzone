# Revisión automática de la nueva web

Proyecto activo: GitHub Movilzone/movilzone, rama main, web https://movilzone.github.io/movilzone/ . No publicar cambios en el proyecto Sites anterior.

1. Obtener el estado actual de main y conservar cualquier cambio del usuario. Leer estas instrucciones y el código actual antes de modificar.
2. Ejecutar `python scripts/sync-catalog.py`. Lee sólo el CSV público configurado de Hoja 3 A:H y guarda precios finales, pesos, cuotas y ofertas vigentes. No escribir en la planilla ni aplicar márgenes. Si falla, conservar archivos e informar sin afirmar que se actualizaron.
3. Comprobar que `data/catalog-fallback.js` coincide con `data/catalog.json`. No publicar ofertas vendidas/retiradas ni descuentos inexistentes. Fotos de variantes sólo si son verificadas; fotos de referencia deben estar identificadas. Auditar rutas rotas, nombres de modelo y recortes. No fabricar imágenes de equipos ni afirmar color exacto si no hay foto.
4. Conservar el PNG original del logo en cabecera, pie y favicon circular transparente. Mantener diseño y funciones de la web actual.
5. Ejecutar `node --test tests/*.test.mjs` y `node --check assets/app.js`. Si hay cambios necesarios, crear un commit con los archivos modificados mediante GitHub, con base en el HEAD actual y actualización sin force; no sobrescribir cambios concurrentes. Si no cambió nada, no crear commits de relleno.
6. Consultar el despliegue de GitHub Pages correspondiente al commit. Publicación y actualización automática sólo se consideran verificadas con evidencia del despliegue/lectura. Si hay error, corregir lo que sea posible y comunicar el bloqueo. Informar únicamente cambios o problemas materiales.

La tarea externa corre tres veces al día; el navegador relee el JSON cada minuto. No depende de `/api/catalog` ni del servidor Sites anterior. El HTML, CSS, JS y assets permanecen dentro del repositorio y GitHub Pages conserva su audiencia pública.
