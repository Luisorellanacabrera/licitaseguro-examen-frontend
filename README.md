# LicitaSeguro — Examen Final Desarrollo Frontend

Sitio web público que permite consultar licitaciones públicas chilenas, filtrarlas por
fecha y estado, revisar el detalle de cada una y buscar proveedores por RUT, consumiendo
la API oficial de Mercado Público (ChileCompra).

**Asignatura:** Desarrollo Frontend — Evaluación 3 (Examen transversal)
**Equipo:** _(completar)_
**Integrantes:** _(completar)_

---

## 1. Cómo ejecutar el proyecto

El proyecto es estático (HTML + CSS + JavaScript puro). **Debe abrirse con un servidor
local**, no haciendo doble clic en el archivo: los navegadores bloquean las peticiones
`fetch` hechas desde el protocolo `file://`.

### Opción A — Python (viene instalado en macOS y Linux)

```bash
python3 -m http.server 8080
```

Luego abrir <http://localhost:8080/index.html>

### Opción B — Visual Studio Code

Instalar la extensión **Live Server** y presionar **Go Live** con `index.html` abierto.

---

## 2. Estructura de carpetas

```
Eval_U3A_LicitaSeguro/
├── index.html              Vista 1: homepage corporativo + formulario de contacto
├── licitaciones.html       Vista 2: listado con filtros, loader y paginación
├── detalle.html            Vista 3: detalle de una licitación
├── proveedores.html        Vista 4: búsqueda de proveedor por RUT
├── css/
│   └── styles.css          Paleta, tipografía, componentes y media queries comentadas
├── js/
│   ├── config.js           Ticket, URLs de endpoints, estados y constantes
│   ├── api.js              Capa de acceso a la API (fetch, timeout, parseo, limpieza)
│   ├── validaciones.js     RUT (módulo 11), fecha, estado y código de licitación
│   ├── ui.js               Loader, alertas, errores por campo y paginación accesible
│   ├── home.js             Controlador del formulario de contacto
│   ├── licitaciones.js     Controlador del listado
│   ├── detalle.js          Controlador del detalle
│   └── proveedores.js      Controlador de la búsqueda de proveedores
├── informe/
│   ├── Informe_Examen_Frontend_LicitaSeguro.pdf   Informe final (29 páginas)
│   ├── Informe_Examen_Frontend_LicitaSeguro.html  Fuente del informe
│   ├── mockups/            4 mockups en SVG (Tarea 1)
│   └── capturas/           Capturas del sitio funcionando
└── README.md
```

---

## 3. Endpoints consumidos

| # | Función | Endpoint |
|---|---------|----------|
| 1 | Listado de licitaciones | `GET /servicios/v1/publico/licitaciones.json?fecha=ddmmaaaa&estado=nombre&ticket=cod` |
| 2 | Detalle de licitación | `GET /servicios/v1/publico/licitaciones.json?codigo=1057539-17-LR25&ticket=cod` |
| 3 | Datos de proveedor | `GET /servicios/v1/Publico/Empresas/BuscarProveedor?rutempresaproveedor=77.653.382-3&ticket=cod` |

El ticket está en `js/config.js` (constante `TICKET`). Si se agota su cuota de consultas,
basta con reemplazar ese valor.

---

## 4. Datos de prueba

| Caso | Valor | Resultado esperado |
|------|-------|--------------------|
| Listado | Fecha: ayer / Estado: Activas | Tarjetas con datos reales y paginación |
| Detalle | `1057539-17-LR25` | Licitación adjudicada del Hospital de Puerto Montt |
| Proveedor válido | `77.653.382-3` | SERVICIOS Y SOLUCIONES INFORMÁTICAS FENRIR SPA |
| RUT con DV erróneo | `77.653.382-K` | Mensaje indicando que el dígito correcto es 3 |
| Fecha inválida | Una fecha futura | "La fecha no puede ser posterior al día de hoy." |
| Código mal formado | `12345` | "El código no cumple el formato de Mercado Público." |

---

## 5. Cumplimiento de las tareas del examen

| Tarea | Dónde se resuelve |
|-------|-------------------|
| 1. Mockups + justificación UI/UX | `informe/mockups/` y sección 5 del informe |
| 2. Vistas responsivas | Media queries comentadas en `css/styles.css` (móvil / tablet / laptop) |
| 3. Validación de formularios, loader y paginación | `js/validaciones.js`, `js/ui.js`, `js/licitaciones.js` |
| 4. Validación de RUT y consumo de endpoints | `js/validaciones.js` (módulo 11) y `js/api.js` |
| 5. Labels, ARIA, tabindex y buenas prácticas | Las 4 vistas HTML |
| 6. Limpieza de respuestas y manejo de errores | `API.limpiarTexto()`, `API.valorSeguro()` y `mensajePorEstadoHTTP()` en `js/api.js` |
| 7. Informe y video | `informe/` y guion del video en la sección 13 del informe |

---

## 6. Tecnologías

- HTML5 semántico
- CSS3 con variables, escala tipográfica modular y media queries propias
- JavaScript ES6+ (módulos IIFE, `async/await`, `fetch`, `AbortController`)
- Bootstrap 5.3.3 vía CDN (grilla, navbar, tarjetas, paginación)
- API pública de Mercado Público v1
