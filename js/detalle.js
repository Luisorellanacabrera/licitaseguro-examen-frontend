/* ==========================================================================
   detalle.js - Controlador de la vista "Detalle de licitacion"
   --------------------------------------------------------------------------
   El codigo de la licitacion llega por la query string (?codigo=XXXX) desde
   el listado, o puede escribirse manualmente en el buscador de esta vista.
   ========================================================================== */

'use strict';

const VistaDetalle = (function () {

  const ID = {
    form: 'form-codigo',
    codigo: 'input-codigo',
    errorCodigo: 'error-codigo',
    boton: 'btn-ver-detalle',
    loader: 'loader-detalle',
    mensajes: 'mensajes-detalle',
    contenido: 'contenido-detalle'
  };

  function iniciar() {
    const formulario = document.getElementById(ID.form);
    if (!formulario) return;

    // Evento: envio del formulario de busqueda por codigo.
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      const validacion = validarCampo();
      if (validacion.valido) cargarDetalle(validacion.codigo);
    });

    // Evento: validacion al salir del campo.
    document.getElementById(ID.codigo).addEventListener('blur', validarCampo);
    document.getElementById(ID.codigo).addEventListener('input', function () {
      UI.limpiarError(ID.codigo, ID.errorCodigo);
    });

    // Si viene el codigo por URL, se carga automaticamente.
    const parametros = new URLSearchParams(window.location.search);
    const codigoUrl = parametros.get('codigo');
    if (codigoUrl) {
      document.getElementById(ID.codigo).value = codigoUrl;
      cargarDetalle(codigoUrl.trim().toUpperCase());
    } else {
      UI.mostrarMensaje(ID.mensajes, 'info', 'Busque una licitacion',
        'Ingrese el codigo de una licitacion o seleccione "Ver detalle" desde el listado.');
    }
  }

  function validarCampo() {
    const resultado = Validaciones.validarCodigoLicitacion(document.getElementById(ID.codigo).value);
    if (!resultado.valido) {
      UI.marcarError(ID.codigo, ID.errorCodigo, resultado.mensaje);
      document.getElementById(ID.codigo).focus();
    } else {
      UI.limpiarError(ID.codigo, ID.errorCodigo);
    }
    return resultado;
  }

  /* ------------------------------------------------------------------
     CONSUMO DEL ENDPOINT DE DETALLE
     ------------------------------------------------------------------ */
  async function cargarDetalle(codigo) {
    UI.limpiarMensaje(ID.mensajes);
    document.getElementById(ID.contenido).innerHTML = '';

    UI.mostrarLoader(ID.loader, { bloquear: ID.contenido, boton: ID.boton });
    const respuesta = await API.obtenerDetalleLicitacion(codigo);
    UI.ocultarLoader(ID.loader, { bloquear: ID.contenido, boton: ID.boton });

    if (!respuesta.ok) {
      UI.mostrarMensaje(ID.mensajes, 'error', 'Error al cargar detalles de la licitacion. Intente mas tarde.', respuesta.error);
      return;
    }

    renderizar(respuesta.datos);
  }

  /* ------------------------------------------------------------------
     RENDERIZADO
     Todo campo nulo o vacio ya viene resuelto como "--" desde api.js.
     ------------------------------------------------------------------ */
  function renderizar(d) {
    const filas = [
      ['Codigo externo', d.codigo],
      ['Estado', d.estado],
      ['Tipo de licitacion', d.tipo],
      ['Moneda', d.moneda],
      ['Monto estimado', d.montoEstimado],
      ['Fecha de publicacion', d.fechaCreacion],
      ['Fecha de cierre', d.fechaCierre],
      ['Fecha de adjudicacion', d.fechaAdjudicacion],
      ['Organismo comprador', d.organismo],
      ['Unidad de compra', d.unidad],
      ['RUT de la unidad', d.rutUnidad],
      ['Region', d.region],
      ['Comuna', d.comuna],
      ['Contacto', d.contacto],
      ['Cargo del contacto', d.cargoContacto],
      ['N.° de adjudicacion', d.adjudicacionNumero]
    ];

    let html =
      '<article>' +
        '<header class="mb-3">' +
          '<span class="ls-badge ' + UI.claseBadge(d.estado) + ' mb-2">Estado: ' + UI.escapar(d.estado) + '</span>' +
          '<h2 class="mt-2">' + UI.escapar(d.nombre) + '</h2>' +
          '<p class="text-muted mb-0">Codigo ' + UI.escapar(d.codigo) + '</p>' +
        '</header>' +

        '<section class="card ls-card mb-4">' +
          '<div class="card-body">' +
            '<h3 class="h5">Descripcion</h3>' +
            '<p class="ls-texto-largo mb-0">' + UI.escapar(d.descripcion) + '</p>' +
          '</div>' +
        '</section>' +

        '<section class="card ls-card mb-4">' +
          '<div class="card-body">' +
            '<h3 class="h5">Antecedentes generales</h3>' +
            '<div class="table-responsive">' +
              '<table class="table table-striped ls-tabla-detalle mb-0">' +
                '<caption class="sr-only-ls">Antecedentes generales de la licitacion ' + UI.escapar(d.codigo) + '</caption>' +
                '<tbody>';

    filas.forEach(function (fila) {
      html += '<tr><th scope="row">' + UI.escapar(fila[0]) + '</th>' +
              '<td>' + UI.escapar(fila[1]) + '</td></tr>';
    });

    html += '</tbody></table></div></div></section>';

    /* Productos o servicios solicitados (arreglo anidado Items.Listado) */
    if (d.items.length > 0) {
      html +=
        '<section class="card ls-card">' +
          '<div class="card-body">' +
            '<h3 class="h5">Productos o servicios solicitados (' + d.items.length + ')</h3>' +
            '<div class="table-responsive">' +
              '<table class="table table-sm table-bordered mb-0">' +
                '<caption class="sr-only-ls">Listado de items de la licitacion</caption>' +
                '<thead><tr>' +
                  '<th scope="col">Producto</th>' +
                  '<th scope="col">Descripcion</th>' +
                  '<th scope="col">Cantidad</th>' +
                  '<th scope="col">Unidad</th>' +
                '</tr></thead><tbody>';

      d.items.forEach(function (item) {
        html += '<tr>' +
          '<td>' + UI.escapar(API.valorSeguro(item.NombreProducto)) + '</td>' +
          '<td>' + UI.escapar(API.valorSeguro(item.Descripcion)) + '</td>' +
          '<td>' + UI.escapar(API.valorSeguro(item.Cantidad)) + '</td>' +
          '<td>' + UI.escapar(API.valorSeguro(item.UnidadMedida)) + '</td>' +
        '</tr>';
      });

      html += '</tbody></table></div></div></section>';
    } else {
      html += '<p class="text-muted">La licitacion no registra items publicados.</p>';
    }

    html += '</article>';

    const contenedor = document.getElementById(ID.contenido);
    contenedor.innerHTML = html;
    // Se lleva el foco al detalle recien cargado (manejo de foco, WCAG 2.4.3).
    contenedor.setAttribute('tabindex', '-1');
    contenedor.focus();
  }

  return { iniciar: iniciar };
})();

document.addEventListener('DOMContentLoaded', VistaDetalle.iniciar);
