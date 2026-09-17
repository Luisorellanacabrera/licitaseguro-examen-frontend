/* ==========================================================================
   validaciones.js - Validacion de formularios (Tareas 3 y 4)
   --------------------------------------------------------------------------
   Cada funcion devuelve { valido: boolean, mensaje: string } para que la
   vista solo tenga que pintar el mensaje debajo del campo correspondiente.
   ========================================================================== */

'use strict';

const Validaciones = (function () {

  /* ------------------------------------------------------------------
     RUT CHILENO - Algoritmo Modulo 11
     Casos cubiertos:
       - campo vacio
       - caracteres no permitidos
       - largo fuera de rango (7 a 8 digitos + DV)
       - digito verificador incorrecto
     ------------------------------------------------------------------ */
  function limpiarRut(rut) {
    // Deja solo digitos y la letra K (el DV puede ser 0-9 o K).
    return String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
  }

  function calcularDigitoVerificador(cuerpo) {
    let suma = 0;
    let multiplicador = 2;
    // Se recorre el cuerpo de derecha a izquierda multiplicando por 2..7.
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const resto = 11 - (suma % 11);
    if (resto === 11) return '0';
    if (resto === 10) return 'K';
    return String(resto);
  }

  function validarRut(rutIngresado) {
    const original = String(rutIngresado || '').trim();

    if (original === '') {
      return { valido: false, mensaje: 'El RUT es obligatorio. Ejemplo: 77.653.382-3' };
    }

    // Caracteres no permitidos (solo numeros, puntos, guion y K).
    if (/[^0-9kK.\-\s]/.test(original)) {
      return { valido: false, mensaje: 'El RUT solo admite numeros, puntos, guion y la letra K. Ejemplo: 77.653.382-3' };
    }

    const limpio = limpiarRut(original);

    if (limpio.length < 8) {
      return { valido: false, mensaje: 'El RUT esta incompleto: debe tener al menos 7 digitos mas el digito verificador.' };
    }
    if (limpio.length > 9) {
      return { valido: false, mensaje: 'El RUT ingresado es demasiado largo. Verifique los digitos ingresados.' };
    }

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    // La letra K solo puede aparecer como digito verificador.
    if (/[K]/.test(cuerpo)) {
      return { valido: false, mensaje: 'La letra K solo puede usarse como digito verificador, al final del RUT.' };
    }

    const dvEsperado = calcularDigitoVerificador(cuerpo);
    if (dv !== dvEsperado) {
      return {
        valido: false,
        mensaje: 'El digito verificador no corresponde. Para ' + formatearRut(cuerpo + dvEsperado).split('-')[0] + ' el digito correcto es ' + dvEsperado + '.'
      };
    }

    return { valido: true, mensaje: '', rutFormateado: formatearRut(limpio) };
  }

  /* Devuelve el RUT con puntos y guion: 77653382 3 -> 77.653.382-3
     Ese es el formato que exige el endpoint de proveedores. */
  function formatearRut(rutLimpio) {
    const limpio = limpiarRut(rutLimpio);
    if (limpio.length < 2) return limpio;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return cuerpoConPuntos + '-' + dv;
  }

  /* ------------------------------------------------------------------
     FECHA DEL FILTRO DE LICITACIONES
     El input type="date" entrega aaaa-mm-dd; la API exige ddmmaaaa.
     ------------------------------------------------------------------ */
  function validarFecha(valorInput) {
    if (!valorInput || valorInput.trim() === '') {
      return { valido: false, mensaje: 'Debe seleccionar una fecha de publicacion para filtrar.' };
    }

    const partes = valorInput.split('-');
    if (partes.length !== 3) {
      return { valido: false, mensaje: 'El formato de la fecha no es valido. Use el selector de fecha.' };
    }

    const fecha = new Date(valorInput + 'T00:00:00');
    if (isNaN(fecha.getTime())) {
      return { valido: false, mensaje: 'La fecha ingresada no existe en el calendario.' };
    }

    // Regla de negocio: la API solo entrega licitaciones ya publicadas.
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fecha > hoy) {
      return { valido: false, mensaje: 'La fecha no puede ser posterior al dia de hoy.' };
    }

    // Mercado Publico mantiene informacion desde el año 2008.
    if (fecha.getFullYear() < 2008) {
      return { valido: false, mensaje: 'Mercado Publico entrega informacion desde el año 2008 en adelante.' };
    }

    return { valido: true, mensaje: '', fechaApi: aFormatoApi(valorInput) };
  }

  function aFormatoApi(valorInput) {
    const p = valorInput.split('-'); // [aaaa, mm, dd]
    return p[2] + p[1] + p[0];       // ddmmaaaa
  }

  /* ------------------------------------------------------------------
     ESTADO DEL FILTRO
     ------------------------------------------------------------------ */
  function validarEstado(valor) {
    if (!valor || valor === '') {
      return { valido: false, mensaje: 'Debe seleccionar un estado de licitacion.' };
    }
    const existe = CONFIG.ESTADOS.some(function (e) { return e.valor === valor; });
    if (!existe) {
      return { valido: false, mensaje: 'El estado seleccionado no es valido.' };
    }
    return { valido: true, mensaje: '' };
  }

  /* ------------------------------------------------------------------
     CODIGO DE LICITACION (usado en la vista de detalle)
     Formato tipico: 1057539-17-LR25
     ------------------------------------------------------------------ */
  function validarCodigoLicitacion(valor) {
    const texto = String(valor || '').trim().toUpperCase();
    if (texto === '') {
      return { valido: false, mensaje: 'Debe indicar el codigo de la licitacion. Ejemplo: 1057539-17-LR25' };
    }
    if (!/^[0-9]+-[0-9]+-[A-Z]{1,3}[0-9]{2}$/.test(texto)) {
      return { valido: false, mensaje: 'El codigo no cumple el formato de Mercado Publico. Ejemplo valido: 1057539-17-LR25' };
    }
    return { valido: true, mensaje: '', codigo: texto };
  }

  return {
    validarRut: validarRut,
    formatearRut: formatearRut,
    validarFecha: validarFecha,
    validarEstado: validarEstado,
    validarCodigoLicitacion: validarCodigoLicitacion
  };
})();
