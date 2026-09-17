/* ==========================================================================
   ui.js - Utilidades de interfaz reutilizables
   --------------------------------------------------------------------------
   Componentes compartidos por las 4 vistas: loader accesible, mensajes de
   error/exito, marcado de campos invalidos, paginacion y escape de HTML.
   ========================================================================== */

'use strict';

const UI = (function () {

  /* ------------------------------------------------------------------
     ESCAPE DE HTML
     Toda la informacion viene de una API externa: se escapa antes de
     inyectarla con innerHTML para evitar inyeccion de codigo (XSS).
     ------------------------------------------------------------------ */
  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto === null || texto === undefined ? '' : String(texto);
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------
     LOADER
     Se muestra ANTES de disparar la peticion y se oculta en el momento
     exacto en que la respuesta fue procesada. Mientras es visible se
     bloquea la interaccion con la zona de resultados y se deshabilita el
     boton que origino la consulta (rubrica 2.1.1).
     ------------------------------------------------------------------ */
  function mostrarLoader(idLoader, opciones) {
    const loader = document.getElementById(idLoader);
    if (!loader) return;
    loader.classList.add('is-visible');
    loader.setAttribute('aria-busy', 'true');

    const config = opciones || {};
    if (config.bloquear) {
      const zona = document.getElementById(config.bloquear);
      if (zona) zona.classList.add('ls-blocked');
    }
    if (config.boton) {
      const boton = document.getElementById(config.boton);
      if (boton) {
        boton.disabled = true;
        boton.setAttribute('aria-disabled', 'true');
      }
    }
  }

  function ocultarLoader(idLoader, opciones) {
    const loader = document.getElementById(idLoader);
    if (!loader) return;
    loader.classList.remove('is-visible');
    loader.setAttribute('aria-busy', 'false');

    const config = opciones || {};
    if (config.bloquear) {
      const zona = document.getElementById(config.bloquear);
      if (zona) zona.classList.remove('ls-blocked');
    }
    if (config.boton) {
      const boton = document.getElementById(config.boton);
      if (boton) {
        boton.disabled = false;
        boton.removeAttribute('aria-disabled');
      }
    }
  }

  /* ------------------------------------------------------------------
     MENSAJES GLOBALES (alertas)
     Se escriben dentro de un contenedor con role="alert" y aria-live, de
     modo que el lector de pantalla los anuncie inmediatamente.
     ------------------------------------------------------------------ */
  function mostrarMensaje(idContenedor, tipo, titulo, detalle) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    const iconos = { error: '&#9888;', info: '&#8505;', exito: '&#10004;', vacio: '&#128269;' };
    const clases = { error: 'alert-danger', info: 'alert-info', exito: 'alert-success', vacio: 'alert-warning' };

    contenedor.innerHTML =
      '<div class="alert ' + (clases[tipo] || 'alert-info') + ' d-flex align-items-start gap-2" role="alert">' +
        '<span aria-hidden="true" class="fs-5">' + (iconos[tipo] || '') + '</span>' +
        '<div>' +
          '<strong>' + escapar(titulo) + '</strong>' +
          (detalle ? '<div class="mt-1">' + escapar(detalle) + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  function limpiarMensaje(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) contenedor.innerHTML = '';
  }

  /* ------------------------------------------------------------------
     VALIDACION VISUAL DE CAMPOS
     El mensaje se escribe en el <span> que ya esta asociado al input por
     aria-describedby, y se marca aria-invalid para los lectores de
     pantalla (no basta con el color rojo).
     ------------------------------------------------------------------ */
  function marcarError(idInput, idMensaje, mensaje) {
    const input = document.getElementById(idInput);
    const span = document.getElementById(idMensaje);
    if (input) {
      input.classList.add('ls-input-error');
      input.setAttribute('aria-invalid', 'true');
    }
    if (span) span.textContent = mensaje;
  }

  function limpiarError(idInput, idMensaje) {
    const input = document.getElementById(idInput);
    const span = document.getElementById(idMensaje);
    if (input) {
      input.classList.remove('ls-input-error');
      input.setAttribute('aria-invalid', 'false');
    }
    if (span) span.textContent = '';
  }

  /* ------------------------------------------------------------------
     PAGINACION (Tarea 3: se activa con mas de 10 resultados)
     Genera los botones y deshabilita "Anterior" en la primera pagina y
     "Siguiente" en la ultima (rubrica 2.1.1 nivel sobresaliente).
     ------------------------------------------------------------------ */
  function renderizarPaginacion(idContenedor, paginaActual, totalPaginas, alCambiarPagina) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    // Con 1 pagina o menos no se dibuja la paginacion.
    if (totalPaginas <= 1) {
      contenedor.innerHTML = '';
      return;
    }

    // Ventana deslizante de 5 numeros para no desbordar en movil.
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    inicio = Math.max(1, fin - 4);

    let html = '<nav aria-label="Paginacion de resultados"><ul class="pagination mb-0">';

    html += '<li class="page-item ' + (paginaActual === 1 ? 'disabled' : '') + '">' +
              '<button type="button" class="page-link" data-pagina="' + (paginaActual - 1) + '" ' +
              (paginaActual === 1 ? 'disabled aria-disabled="true"' : '') + '>' +
              '<span aria-hidden="true">&laquo;</span> Anterior</button></li>';

    for (let i = inicio; i <= fin; i++) {
      const esActual = i === paginaActual;
      html += '<li class="page-item ' + (esActual ? 'active' : '') + '">' +
                '<button type="button" class="page-link" data-pagina="' + i + '" ' +
                (esActual ? 'aria-current="page"' : '') +
                ' aria-label="Ir a la pagina ' + i + '">' + i + '</button></li>';
    }

    html += '<li class="page-item ' + (paginaActual === totalPaginas ? 'disabled' : '') + '">' +
              '<button type="button" class="page-link" data-pagina="' + (paginaActual + 1) + '" ' +
              (paginaActual === totalPaginas ? 'disabled aria-disabled="true"' : '') + '>' +
              'Siguiente <span aria-hidden="true">&raquo;</span></button></li>';

    html += '</ul></nav>';
    contenedor.innerHTML = html;

    // Evento delegado: un solo listener para todos los botones.
    contenedor.querySelectorAll('button[data-pagina]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        const destino = parseInt(boton.getAttribute('data-pagina'), 10);
        if (destino >= 1 && destino <= totalPaginas && destino !== paginaActual) {
          alCambiarPagina(destino);
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     BADGE DE ESTADO (color + texto, nunca solo color)
     ------------------------------------------------------------------ */
  function claseBadge(estado) {
    const e = String(estado || '').toLowerCase();
    if (e.indexOf('public') === 0) return 'ls-badge-publicada';
    if (e.indexOf('cerrad') === 0) return 'ls-badge-cerrada';
    if (e.indexOf('adjudic') === 0) return 'ls-badge-adjudicada';
    if (e.indexOf('desiert') === 0) return 'ls-badge-desierta';
    if (e.indexOf('revocad') === 0) return 'ls-badge-revocada';
    return 'ls-badge-cerrada';
  }

  /* Marca el enlace activo del menu con aria-current="page" */
  function marcarNavegacionActiva() {
    const archivo = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.ls-navbar .nav-link').forEach(function (enlace) {
      const href = enlace.getAttribute('href');
      if (href === archivo) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', marcarNavegacionActiva);

  return {
    escapar: escapar,
    mostrarLoader: mostrarLoader,
    ocultarLoader: ocultarLoader,
    mostrarMensaje: mostrarMensaje,
    limpiarMensaje: limpiarMensaje,
    marcarError: marcarError,
    limpiarError: limpiarError,
    renderizarPaginacion: renderizarPaginacion,
    claseBadge: claseBadge
  };
})();
