# 📱 MÓVIL ZONE - Sitio Web Oficial

Sitio web moderno, ultra-rápido y responsive para **Móvil Zone**, tienda de smartphones libres, accesorios premium y servicio técnico especializado.

---

## 🚀 Características Principales

1. **Catálogo Interactivo**:
   - Marcas: Apple iPhone, Samsung Galaxy, Xiaomi, Motorola y Accesorios/Audio.
   - Filtros instantáneos por categoría y buscador dinámico en tiempo real.
   - Vista rápida con especificaciones completas (pantalla, procesador, cámara, batería, memoria y garantía).
   
2. **Selector Multimoneda Automático**:
   - Soporte para **USD ($)**, **Pesos Argentinos (ARS)**, **Pesos Mexicanos (MXN)**, **Euros (€)** y **Pesos Colombianos (COP)**.
   - Todos los precios del catálogo, carrito y cotizaciones de reparación se actualizan en tiempo real según la moneda seleccionada.

3. **Cotizador de Reparaciones & Servicio Técnico Express**:
   - Calculadora paso a paso en 3 clics: Marca ➡️ Modelo ➡️ Tipo de Falla (Pantalla OLED, Batería 100%, Pin de carga, Tapa trasera, etc.).
   - Muestra de inmediato: precio estimado, tiempo de demora promedio (ej: 30 a 45 min) y tiempo de garantía.
   - Botón directo para agendar turno por WhatsApp con el mensaje pre-completado.

4. **Carrito de Compras con Checkout por WhatsApp**:
   - Carrito persistente en el navegador (`localStorage`).
   - Generación automática del detalle del pedido con lista de productos, cantidades y valor total formateado para enviar a WhatsApp con un solo clic.

5. **Plan Canje (Trade-in)**:
   - Sección informativa y botón de contacto para cotizar celulares usados como parte de pago.

6. **Diseño Visual de Vanguardia**:
   - Paleta Cyber-Tech Dark Mode (inspirada en Apple Store y Samsung Experience).
   - Glassmorphism, animaciones sutiles y diseño 100% adaptable a celulares, tablets y computadoras.

---

## 📂 Estructura de Archivos

```text
noble-archimedes/
├── index.html            # Estructura principal y componentes visuales
├── css/
│   └── styles.css        # Estilos custom, glassmorphism, animaciones y scrollbars
├── js/
│   ├── data.js           # Base de datos de productos, servicios, precios y teléfonos
│   └── app.js            # Lógica del carrito, filtros, buscador y cotizador
├── abrir-web.bat         # Acceso directo para abrir la web en tu navegador (Doble clic)
├── start-server.ps1      # Servidor web local en PowerShell (opcional)
└── README.md             # Esta documentación
```

---

## 🛠️ Cómo Personalizar la Información

Todos los datos del negocio y productos se editan fácilmente en el archivo **`js/data.js`**:

### 1. Cambiar Número de WhatsApp y Datos de Contacto
En las primeras líneas de `js/data.js`:
```javascript
business: {
  name: "MÓVIL ZONE",
  whatsapp: "5491145678901", // Tu número con código de país sin '+' ni espacios
  address: "Tu dirección aquí",
  hours: "Lunes a Sábado de 10:00 a 20:00 hs",
  // ...
}
```

### 2. Modificar Tipos de Cambio o Precios
En `js/data.js`, en el objeto `currencies`:
```javascript
currencies: {
  USD: { symbol: "US$", rate: 1, name: "Dólares (USD)" },
  ARS: { symbol: "$", rate: 1250, name: "Pesos Argentinos (ARS)" }, // Ajustar cotización
  // ...
}
```

### 3. Agregar o Editar Productos
En la sección `products` de `js/data.js`, simplemente podés copiar un producto existente y modificar el nombre, precio base en USD, imagen y especificaciones.

---

## 🌐 Cómo Publicar en Internet Gratis
Este proyecto está optimizado con HTML5 estándar y CDN, por lo que podés subirlo gratis en 1 minuto a:
- **Netlify**: Arrastrar y soltar la carpeta en [netlify.com/drop](https://app.netlify.com/drop).
- **Vercel**: `vercel deploy` o vinculando con GitHub.
- **GitHub Pages**: Activando Pages en la configuración del repositorio.
