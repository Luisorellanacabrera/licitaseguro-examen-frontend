/* ==========================================================================
   licitaciones.js - Controlador de la vista "Listado de licitaciones"
   --------------------------------------------------------------------------
   Flujo completo (Tareas 2, 3 y 6):
     1. El usuario elige fecha y estado -> se validan ambos campos.
     2. Se muestra el loader y se bloquea la interaccion.
     3. Se consume el endpoint de listado.
     4. Se oculta el loader y se renderizan los resultados.
     5. Si hay mas de 10 resultados se activa la paginacion en cliente.
   ========================================================================== */

'use strict';

const VistaLicitaciones = (function () {

  /* Estado interno de la vista (se mantiene fuera del DOM) */
  const estado = {
    resultados: [],
    paginaActual: 1,
    filtros: { fecha: '', estado: '' }
  };

  /* Identificadores del DOM agrupados para facilitar el mantenimiento */
  const ID = {
    form: 'form-filtros',
    fecha: 'filtro-fecha',
    errorFecha: 'error-fecha',
    estado: 'filtro-estado',
    errorEstado: 'error-estado',
    boton: 'btn-buscar',
    loader: 'loader-licitaciones',
    mensajes: 'mensajes-licitaciones',
    resultados: 'contenedor-resultados',
    resumen: 'resumen-resultados',
    paginacion: 'contenedor-paginacion'
  };

  /* ------------------------------------------------------------------
     INICIALIZACION: registro de eventos (Indicador 2.1.1)
     ------------------------------------------------------------------ */
  function iniciar() {
    const formulario = document.getElementById(ID.form);
    if (!formulario) return;

    poblarSelectEstados();

    // Fecha por defecto: el dia de ayer (siempre tiene publicaciones).
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    document.getElementById(ID.fecha).value = ayer.toISOString().slice(0, 10);
    document.getElementById(ID.fecha).max = new Date().toISOString().slice(0, 10);

    // Evento 1: envio del formulario (funciona con click y con Enter).
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      buscar();
    });

    // Evento 2: validacion en vivo al salir de cada campo (blur).
    document.getElementById(ID.fecha).addEventListener('blur', validarCampoFecha);
    document.getElementById(ID.estado).addEventListener('change', validarCampoEstado);

    // Evento 3: al corregir el campo se limpia el error inmediatamente.
    document.getElementById(ID.fecha).addEventListener('input', function () {
      UI.limpiarError(ID.fecha, ID.errorFecha);
    });

    // Evento 4: boton "Limpiar filtros".
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);

    // Si la URL trae parametros (?fecha=&estado=) se ejecuta la busqueda.
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('estado')) {
      document.getElementById(ID.estado).value = parametros.get('estado');
    }
    buscar();
  }

  function poblarSelectEstados() {
    const select = document.getElementById(ID.estado);
    select.innerHTML = '<option value="">Seleccione un estado...</option>';
    CONFIG.ESTADOS.forEach(function (item) {
      const opcion = document.createElement('option');
      opcion.value = item.valor;
      opcion.textContent = item.texto;
      select.appendChild(opcion);
    });
    select.value = 'activas'; // valor por defecto
  }

  /* ------------------------------------------------------------------
     VALIDACIONES (Indicador 2.1.2)
     ------------------------------------------------------------------ */
  function validarCampoFecha() {
    const resultado = Validaciones.validarFecha(document.getElementById(ID.fecha).value);
    if (!resultado.valido) {
      UI.marcarError(ID.fecha, ID.errorFecha, resultado.mensaje);
    } else {
      UI.limpiarError(ID.fecha, ID.errorFecha);
    }
    return resultado;
  }

  function validarCampoEstado() {
    const resultado = Validaciones.validarEstado(document.getElementById(ID.estado).value);
    if (!resultado.valido) {
      UI.marcarError(ID.estado, ID.errorEstado, resultado.mensaje);
    } else {
      UI.limpiarError(ID.estado, ID.errorEstado);
    }
    return resultado;
  }

  /* ------------------------------------------------------------------
     BUSQUEDA: consumo del endpoint
     ------------------------------------------------------------------ */
  async function buscar() {
    const resFecha = validarCampoFecha();
    const resEstado = validarCampoEstado();

    // Si algo falla, se lleva el foco al primer campo con error (usabilidad).
    if (!resFecha.valido || !resEstado.valido) {
      document.getElementById(resFecha.valido ? ID.estado : ID.fecha).focus();
      UI.mostrarMensaje(ID.mensajes, 'error', 'Revise los filtros',
        'Corrija los campos marcados en rojo antes de continuar.');
      return;
    }

    UI.limpiarMensaje(ID.mensajes);
    document.getElementById(ID.resultados).innerHTML = '';
    document.getElementById(ID.paginacion).innerHTML = '';
    document.getElementById(ID.resumen).textContent = '';

    // El loader aparece ANTES de la peticion y bloquea la zona de resultados.
    UI.mostrarLoader(ID.loader, { bloquear: ID.resultados, boton: ID.boton });

    const respuesta = await API.obtenerLicitaciones(
      resFecha.fechaApi,
      document.getElementById(ID.estado).value
    );

    // El loader desaparece en el instante en que la respuesta fue procesada.
    UI.ocultarLoader(ID.loader, { bloquear: ID.resultados, boton: ID.boton });

    if (!respuesta.ok) {
      UI.mostrarMensaje(ID.mensajes, 'error', 'No fue posible obtener las licitaciones', respuesta.error);
      return;
    }

    if (respuesta.datos.length === 0) {
      UI.mostrarMensaje(ID.mensajes, 'vacio', 'Sin resultados',
        'No se encontraron licitaciones para la fecha y el estado seleccionados. Pruebe con otra fecha.');
      return;
    }

    estado.resultados = respuesta.datos;
    estado.paginaActual = 1;
    estado.filtros.fecha = document.getElementById(ID.fecha).value;
    estado.filtros.estado = document.getElementById(ID.estado).value;

    renderizarPagina(1);
  }

  /* ------------------------------------------------------------------
     RENDERIZADO + PAGINACION (Tarea 3)
     ------------------------------------------------------------------ */
  function renderizarPagina(pagina) {
    estado.paginaActual = pagina;

    const total = estado.resultados.length;
    const totalPaginas = Math.ceil(total / CONFIG.ITEMS_POR_PAGINA);
    const desde = (pagina - 1) * CONFIG.ITEMS_POR_PAGINA;
    const hasta = Math.min(desde + CONFIG.ITEMS_POR_PAGINA, total);
    const bloque = estado.resultados.slice(desde, hasta);

    // Resumen anunciado por aria-live para usuarios de lector de pantalla.
    document.getElementById(ID.resumen).textContent =
      'Mostrando ' + (desde + 1) + ' a ' + hasta + ' de ' + total +
      ' licitaciones encontradas. Pagina ' + pagina + ' de ' + totalPaginas + '.';

    let html = '<div class="row g-3">';
    bloque.forEach(function (lic) {
      const fechaCierre = API.formatearFecha(lic.fechaCierre);
      html +=
        '<div class="col-12 col-md-6 col-lg-4">' +
          '<article class="card ls-card ls-licitacion-card">' +
            '<div class="card-body d-flex flex-column">' +
              '<span class="ls-badge ' + UI.claseBadge(lic.estado) + ' mb-2">' +
                'Estado: ' + UI.escapar(lic.estado) +
              '</span>' +
              '<h3 class="card-title">' + UI.escapar(lic.nombre) + '</h3>' +
              '<p class="mb-1"><strong>Codigo:</strong> ' + UI.escapar(lic.codigo) + '</p>' +
              '<p class="mb-3"><strong>Cierre:</strong> ' + UI.escapar(fechaCierre) + '</p>' +
              '<a class="btn ls-btn-primary mt-auto" ' +
                 'href="detalle.html?codigo=' + encodeURIComponent(lic.codigo) + '" ' +
                 'aria-label="Ver el detalle de la licitacion ' + UI.escapar(lic.codigo) + '">' +
                 'Ver detalle' +
              '</a>' +
            '</div>' +
          '</article>' +
        '</div>';
    });
    html += '</div>';

    document.getElementById(ID.resultados).innerHTML = html;

    // La paginacion solo se dibuja cuando hay mas de 10 resultados.
    UI.renderizarPaginacion(ID.paginacion, pagina, totalPaginas, function (nueva) {
      renderizarPagina(nueva);
      // Se devuelve el foco al inicio de los resultados tras cambiar de pagina.
      document.getElementById(ID.resumen).focus();
    });
  }

  function limpiarFiltros() {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    document.getElementById(ID.fecha).value = ayer.toISOString().slice(0, 10);
    document.getElementById(ID.estado).value = 'activas';
    UI.limpiarError(ID.fecha, ID.errorFecha);
    UI.limpiarError(ID.estado, ID.errorEstado);
    UI.limpiarMensaje(ID.mensajes);
    document.getElementById(ID.fecha).focus();
  }

  return { iniciar: iniciar };
})();

document.addEventListener('DOMContentLoaded', VistaLicitaciones.iniciar);
