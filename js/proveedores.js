/* ==========================================================================
   proveedores.js - Controlador de la vista "Buscar proveedor por RUT"
   --------------------------------------------------------------------------
   Tarea 4: valida el RUT con modulo 11, muestra un mensaje de error distinto
   para cada caso y consume el endpoint BuscarProveedor. Si la respuesta trae
   datos muestra la razon social; si viene vacia muestra "Proveedor no
   encontrado".
   ========================================================================== */

'use strict';

const VistaProveedores = (function () {

  const ID = {
    form: 'form-proveedor',
    rut: 'input-rut',
    errorRut: 'error-rut',
    boton: 'btn-buscar-proveedor',
    loader: 'loader-proveedor',
    mensajes: 'mensajes-proveedor',
    resultado: 'resultado-proveedor'
  };

  /* Historial de consultas de la sesion (mejora de usabilidad) */
  const historial = [];

  function iniciar() {
    const formulario = document.getElementById(ID.form);
    if (!formulario) return;

    // Evento 1: envio del formulario.
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      buscar();
    });

    // Evento 2: formateo automatico del RUT mientras se escribe.
    const inputRut = document.getElementById(ID.rut);
    inputRut.addEventListener('input', function () {
      UI.limpiarError(ID.rut, ID.errorRut);
      const limpio = inputRut.value.replace(/[^0-9kK]/g, '');
      if (limpio.length > 1) {
        inputRut.value = Validaciones.formatearRut(limpio);
      }
    });

    // Evento 3: validacion al salir del campo.
    inputRut.addEventListener('blur', validarCampo);

    // Evento 4: botones de ejemplo (RUT de prueba de la documentacion).
    document.querySelectorAll('[data-rut-ejemplo]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        inputRut.value = boton.getAttribute('data-rut-ejemplo');
        UI.limpiarError(ID.rut, ID.errorRut);
        inputRut.focus();
      });
    });
  }

  function validarCampo() {
    const resultado = Validaciones.validarRut(document.getElementById(ID.rut).value);
    if (!resultado.valido) {
      UI.marcarError(ID.rut, ID.errorRut, resultado.mensaje);
    } else {
      UI.limpiarError(ID.rut, ID.errorRut);
    }
    return resultado;
  }

  /* ------------------------------------------------------------------
     CONSUMO DEL ENDPOINT DE PROVEEDORES
     ------------------------------------------------------------------ */
  async function buscar() {
    const validacion = validarCampo();

    // El formulario NO se envia si el RUT es incorrecto.
    if (!validacion.valido) {
      document.getElementById(ID.rut).focus();
      document.getElementById(ID.resultado).innerHTML = '';
      return;
    }

    UI.limpiarMensaje(ID.mensajes);
    document.getElementById(ID.resultado).innerHTML = '';
    UI.mostrarLoader(ID.loader, { bloquear: ID.resultado, boton: ID.boton });

    const respuesta = await API.buscarProveedor(validacion.rutFormateado);

    UI.ocultarLoader(ID.loader, { bloquear: ID.resultado, boton: ID.boton });

    // Caso 1: error de red o codigo HTTP distinto de 200.
    if (!respuesta.ok) {
      UI.mostrarMensaje(ID.mensajes, 'error', 'No fue posible consultar el proveedor', respuesta.error);
      return;
    }

    // Caso 2: la API respondio correctamente pero sin resultados.
    if (respuesta.vacio) {
      UI.mostrarMensaje(ID.mensajes, 'vacio', 'Proveedor no encontrado',
        'El RUT ' + validacion.rutFormateado + ' no se encuentra registrado como proveedor en Mercado Publico.');
      return;
    }

    // Caso 3: proveedor encontrado.
    renderizar(respuesta.datos);
    agregarAlHistorial(respuesta.datos);
  }

  function renderizar(proveedor) {
    document.getElementById(ID.resultado).innerHTML =
      '<div class="card ls-card">' +
        '<div class="card-body">' +
          '<span class="ls-badge ls-badge-publicada mb-2">Proveedor encontrado</span>' +
          '<h3 class="mt-2">' + UI.escapar(proveedor.razonSocial) + '</h3>' +
          '<dl class="row mb-0 mt-3">' +
            '<dt class="col-sm-4">RUT consultado</dt>' +
            '<dd class="col-sm-8">' + UI.escapar(proveedor.rut) + '</dd>' +
            '<dt class="col-sm-4">Codigo de empresa</dt>' +
            '<dd class="col-sm-8">' + UI.escapar(proveedor.codigo) + '</dd>' +
            '<dt class="col-sm-4">Razon social</dt>' +
            '<dd class="col-sm-8">' + UI.escapar(proveedor.razonSocial) + '</dd>' +
          '</dl>' +
        '</div>' +
      '</div>';

    const contenedor = document.getElementById(ID.resultado);
    contenedor.setAttribute('tabindex', '-1');
    contenedor.focus();
  }

  function agregarAlHistorial(proveedor) {
    const yaExiste = historial.some(function (p) { return p.rut === proveedor.rut; });
    if (!yaExiste) historial.unshift(proveedor);

    const caja = document.getElementById('historial-proveedores');
    if (!caja) return;

    if (historial.length === 0) { caja.innerHTML = ''; return; }

    let html = '<h3 class="h6">Consultas realizadas en esta sesion</h3><ul class="list-group">';
    historial.slice(0, 5).forEach(function (p) {
      html += '<li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">' +
                '<span>' + UI.escapar(p.rut) + '</span>' +
                '<span class="text-muted">' + UI.escapar(p.razonSocial) + '</span>' +
              '</li>';
    });
    html += '</ul>';
    caja.innerHTML = html;
  }

  return { iniciar: iniciar };
})();

document.addEventListener('DOMContentLoaded', VistaProveedores.iniciar);
