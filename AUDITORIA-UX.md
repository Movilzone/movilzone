# MovilZone — auditoría técnica y de experiencia

**Fecha:** 21/10/2026  
**Repositorio:** `Movilzone/movilzone`  
**Sitio publicado:** https://movilzone.github.io/movilzone/  
**Alcance:** lectura del repositorio y sus pruebas, estructura HTML, JavaScript, CSS, catálogo y recursos. No se ha realizado auditoría visual con capturas ni prueba humana de navegación en el navegador.

## Resumen ejecutivo

La web ya ofrece una buena base: diseño responsive, catálogo filtrable, fichas con variantes, ofertas y consultas individuales por WhatsApp. El principal objetivo comercial es convertir visitas en conversaciones útiles con el local sin prometer stock ni pagos que no existen.

En el commit base auditado había **138 variantes de 68 modelos**, 2 entradas marcadas como oferta y cuatro marcas comerciales de celulares, además de productos Apple complementarios. El sitio usa GitHub Pages y una sincronización externa de una lista pública. Los datos deben considerarse orientativos hasta confirmarlos con el comercio.

## Hallazgos priorizados

| Prioridad | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| Alta | Consulta de varios equipos obligaba a contactar por cada ficha | Los botones originales usaban `data-product-contact` para un solo producto | **Corregido en este PR**: selección persistente y mensaje conjunto por WhatsApp |
| Alta | La página descargaba el catálogo de respaldo aunque funcionara la fuente JSON | `index.html` cargaba `data/catalog-fallback.js` de forma incondicional | **Corregido en este PR**: respaldo bajo demanda ante error |
| Alta | Fuente comercial requiere verificación | En el catálogo base `live: false`, `sourceLabel: Actualizada · 20/10/2026 · 12:52` | **Pendiente operativo**: confirmar salud del sincronizador; no modificar precios desde la web |
| Media | La página no tenía un flujo de selección persistente ni confirmación de agregados | No había almacenamiento de una lista de equipos ni modal de consulta agrupada | **Corregido en este PR** con límite de 15 equipos, acceso rápido y estados accesibles |
| Media | Navegación y filtros requieren señales accesibles | Filtros sin `role=group`; el menú móvil no cambiaba su etiqueta descriptiva | **Corregido en este PR**; resta probar lector de pantalla y teclado en navegador |
| Media | Favicon pesado para una página estática | `assets/favicon.svg` ocupa ~1,07 MB, por incorporar el logo original | **Pendiente**: optimizar sin redibujar ni degradar el logo oficial |
| Media | Productos individualizados no tienen URLs SEO independientes | Fichas accesibles por fragmentos `#producto/...` | **Pendiente**: evaluar páginas públicas por producto con canonical y metadatos propios |
| Media | Sin evidencia de métricas del embudo comercial | No se encontró una instrumentación de eventos de búsqueda, ficha y contacto en `assets/app.js` | **Pendiente**: definir métricas compatibles con privacidad y consentimiento |
| Baja | Hoja de estilos difícil de mantener | `assets/styles.css` tenía ~45 KB con reglas acumuladas y media queries repetidas | **Pendiente**: refactor por componentes después de comparar visualmente pantallas |

## Entregas de esta rama

1. **Mi selección:** hasta 15 modelos; precios marcados como referencia; una sola conversación de WhatsApp, no carrito de pagos ni reserva.
2. **Persistencia local:** se conservan IDs y colores mientras el navegador lo permita.
3. **Selección por variante:** exige pasar por el detalle cuando debe elegirse una combinación de color/capacidad.
4. **Carga del respaldo:** sólo ante un error de la fuente principal, manteniendo compatibilidad con `file://` y sin alterar el sincronizador de precios.
5. **Accesibilidad:** información de estado, nombres accesibles de acciones y grupo de filtros.
6. **QA automático:** workflow liviano para sintaxis de JavaScript y los tests de repositorio.

## Pruebas de aceptación antes de fusionar

- [ ] Abrir la Home real desde el dominio de GitHub Pages en móvil y escritorio; verificar logos, hero, categorías y navegación.
- [ ] Buscar y filtrar equipos; seleccionar marcas y ordenar; limpiar filtros.
- [ ] Abrir un equipo con variantes, cambiar capacidad y color, agregarlo a Mi selección y comprobar que se guarda la opción correcta.
- [ ] Agregar más de un equipo, recargar, verificar persistencia y eliminar uno.
- [ ] Comprobar el contenido y formato del mensaje enviado a WhatsApp, sin enviarlo a un cliente real durante las pruebas.
- [ ] Probar teclado, foco al abrir/cerrar los diálogos y modo de movimiento reducido.
- [ ] Desconectar la fuente JSON en una prueba controlada y comprobar el respaldo; nunca simular caída en la web pública.
- [ ] Validar `node --check assets/app.js` y `node --test tests/*.test.mjs` en CI.
- [ ] Confirmar actualización de la lista de venta antes de aceptar precios y ofertas como vigentes.

## Restricciones comerciales preservadas

No modificar ni sobrescribir la planilla fuente, no agregar márgenes, no alterar descuentos, no prometer disponibilidad, no convertir la consulta en una venta cobrada, no cambiar logos originales y no publicar ni fusionar la rama sin QA visual.

**Estado de esta auditoría:** código y estructura revisados; PR creado; pruebas automáticas aprobadas al momento de elaborar el informe. La verificación visual, comercial y del despliegue sigue pendiente.
