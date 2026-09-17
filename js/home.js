/* ==========================================================================
   home.js - Validacion del formulario de contacto del homepage (Tarea 3)
   --------------------------------------------------------------------------
   Cada campo tiene su propia funcion de validacion y su propio mensaje de
   error, mostrado justo debajo del campo y anunciado por aria-live.
   ========================================================================== */

'use strict';

const VistaHome = (function () {

  function iniciar() {
    const formulario = document.getElementById('form-contacto');
    if (!formulario) return;

    // Evento: envio del formulario.
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      enviar();
    });

    // Evento: validacion al salir de cada campo (feedback temprano).
    document.getElementById('contacto-nombre').addEventListener('blur', validarNombre);
    document.getElementById('contacto-email').addEventListener('blur', validarEmail);
    document.getElementById('contacto-mensaje').addEventListener('blur', validarMensaje);
    document.getElementById('contacto-rut').addEventListener('blur', validarRutOpcional);

    // Evento: se limpia el error apenas el usuario corrige.
    ['nombre', 'email', 'mensaje', 'rut'].forEach(function (campo) {
      document.getElementById('contacto-' + campo).addEventListener('input', function () {
        UI.limpiarError('contacto-' + campo, 'error-contacto-' + campo);
      });
    });

    // Evento: formateo automatico del RUT opcional.
    document.getElementById('contacto-rut').addEventListener('input', function (e) {
      const limpio = e.target.value.replace(/[^0-9kK]/g, '');
      if (limpio.length > 1) e.target.value = Validaciones.formatearRut(limpio);
    });
  }

  /* ------------------ Validaciones campo por campo ------------------ */

  function validarNombre() {
    const valor = document.getElementById('contacto-nombre').value.trim();
    if (valor === '') {
      UI.marcarError('contacto-nombre', 'error-contacto-nombre', 'El nombre es obligatorio.');
      return false;
    }
    if (valor.length < 3) {
      UI.marcarError('contacto-nombre', 'error-contacto-nombre', 'El nombre debe tener al menos 3 caracteres.');
      return false;
    }
    if (valor.length > 60) {
      UI.marcarError('contacto-nombre', 'error-contacto-nombre', 'El nombre no puede superar los 60 caracteres.');
      return false;
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/.test(valor)) {
      UI.marcarError('contacto-nombre', 'error-contacto-nombre', 'El nombre solo admite letras, espacios, guiones y apostrofes.');
      return false;
    }
    UI.limpiarError('contacto-nombre', 'error-contacto-nombre');
    return true;
  }

  function validarEmail() {
    const valor = document.getElementById('contacto-email').value.trim();
    if (valor === '') {
      UI.marcarError('contacto-email', 'error-contacto-email', 'El correo electronico es obligatorio.');
      return false;
    }
    if (valor.indexOf('@') === -1) {
      UI.marcarError('contacto-email', 'error-contacto-email', 'El correo debe incluir el simbolo @. Ejemplo: nombre@empresa.cl');
      return false;
    }
    // Expresion regular: texto @ dominio . extension (2 a 10 letras)
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,10}$/.test(valor)) {
      UI.marcarError('contacto-email', 'error-contacto-email', 'El formato del correo no es valido. Ejemplo: nombre@empresa.cl');
      return false;
    }
    UI.limpiarError('contacto-email', 'error-contacto-email');
    return true;
  }

  function validarMensaje() {
    const valor = document.getElementById('contacto-mensaje').value.trim();
    if (valor === '') {
      UI.marcarError('contacto-mensaje', 'error-contacto-mensaje', 'El mensaje es obligatorio.');
      return false;
    }
    if (valor.length < 10) {
      UI.marcarError('contacto-mensaje', 'error-contacto-mensaje',
        'El mensaje es muy corto: faltan ' + (10 - valor.length) + ' caracteres para el minimo de 10.');
      return false;
    }
    if (valor.length > 300) {
      UI.marcarError('contacto-mensaje', 'error-contacto-mensaje',
        'El mensaje supera el maximo de 300 caracteres (actualmente tiene ' + valor.length + ').');
      return false;
    }
    UI.limpiarError('contacto-mensaje', 'error-contacto-mensaje');
    return true;
  }

  /* El RUT es opcional: solo se valida si el usuario escribio algo. */
  function validarRutOpcional() {
    const valor = document.getElementById('contacto-rut').value.trim();
    if (valor === '') {
      UI.limpiarError('contacto-rut', 'error-contacto-rut');
      return true;
    }
    const resultado = Validaciones.validarRut(valor);
    if (!resultado.valido) {
      UI.marcarError('contacto-rut', 'error-contacto-rut', resultado.mensaje);
      return false;
    }
    UI.limpiarError('contacto-rut', 'error-contacto-rut');
    return true;
  }

  /* ------------------------- Envio ------------------------- */

  function enviar() {
    // Se evaluan TODOS los campos para mostrar todos los errores a la vez.
    const validos = [validarNombre(), validarEmail(), validarMensaje(), validarRutOpcional()];
    const hayErrores = validos.indexOf(false) !== -1;

    if (hayErrores) {
      UI.mostrarMensaje('mensajes-contacto', 'error', 'El formulario tiene errores',
        'Revise los mensajes que aparecen bajo cada campo y vuelva a intentarlo.');
      // El foco se lleva al primer campo con error (usabilidad + accesibilidad).
      const primerError = document.querySelector('#form-contacto .ls-input-error');
      if (primerError) primerError.focus();
      return;
    }

    // El sitio es de solo consulta: no existe backend, por lo que se simula
    // el envio y se informa con transparencia al usuario.
    UI.mostrarMensaje('mensajes-contacto', 'exito', 'Mensaje registrado correctamente',
      'Gracias por escribir a LicitaSeguro. Un ejecutivo respondera en un plazo de 48 horas habiles.');
    document.getElementById('form-contacto').reset();
    document.getElementById('contacto-nombre').focus();
  }

  return { iniciar: iniciar };
})();

document.addEventListener('DOMContentLoaded', VistaHome.iniciar);
