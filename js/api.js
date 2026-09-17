/* ==========================================================================
   api.js - Capa de acceso a la API de Mercado Publico
   --------------------------------------------------------------------------
   Responsabilidades (una sola por funcion, codigo modular):
     1. Construir las URL de los 3 endpoints solicitados.
     2. Ejecutar la peticion con timeout y control de codigos HTTP.
     3. Parsear el JSON de forma robusta (la API a veces responde HTML).
     4. Limpiar tildes y caracteres especiales mal codificados (Tarea 6).
     5. Devolver SIEMPRE un objeto con la forma { ok, datos, error }
        para que las vistas no tengan que manejar excepciones sueltas.
   ========================================================================== */

'use strict';

const API = (function () {

  /* ------------------------------------------------------------------
     ERRORES CONTEXTUALIZADOS
     Cada codigo HTTP se traduce a un mensaje entendible por el usuario
     final (rubrica: "renderiza mensaje contextualizado").
     ------------------------------------------------------------------ */
  function mensajePorEstadoHTTP(status) {
    const mapa = {
      400: 'La consulta enviada no es valida. Revise la fecha y el estado seleccionados.',
      401: 'Credencial (ticket) no autorizada para consultar la API de Mercado Publico.',
      403: 'Sin permisos para acceder a este recurso de Mercado Publico.',
      404: 'No se encontro el recurso solicitado en Mercado Publico.',
      429: 'Se alcanzo el limite de consultas permitidas por minuto. Espere unos segundos e intente nuevamente.',
      500: 'El servidor de Mercado Publico presenta un problema interno. Intente mas tarde.',
      502: 'Servidor no disponible (puerta de enlace). Intente mas tarde.',
      503: 'Servidor no disponible temporalmente. Intente mas tarde.',
      504: 'El servidor de Mercado Publico demoro demasiado en responder.'
    };
    return mapa[status] || ('Error inesperado del servidor (codigo HTTP ' + status + ').');
  }

  /* ------------------------------------------------------------------
     LIMPIEZA DE TEXTO (Tarea 6)
     La API entrega textos en mayusculas, con comillas tipograficas, con
     dobles espacios y ocasionalmente con tildes mal codificadas
     (mojibake del tipo "Ã‰" cuando el origen es Latin-1 leido como UTF-8).
     ------------------------------------------------------------------ */
  const REEMPLAZOS_MOJIBAKE = {
    'Ã¡': 'a', 'Ã©': 'e', 'Ã­': 'i', 'Ã³': 'o', 'Ãº': 'u',
    'Ã': 'A', 'Ã‰': 'E', 'Ã': 'I', 'Ã“': 'O', 'Ãš': 'U',
    'Ã±': 'n', 'Ã‘': 'N', 'Ã¼': 'u', 'â€“': '-', 'â€”': '-',
    'â€œ': '"', 'â€': '"', 'â€™': "'", 'Â': ''
  };

  function limpiarTexto(valor) {
    if (valor === null || valor === undefined) return '';
    let texto = String(valor);

    // 1. Corrige tildes mal codificadas.
    Object.keys(REEMPLAZOS_MOJIBAKE).forEach(function (mal) {
      texto = texto.split(mal).join(REEMPLAZOS_MOJIBAKE[mal]);
    });

    // 2. Normaliza comillas tipograficas y espacios duros.
    texto = texto
      .replace(/[“”„«»]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/ /g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return texto;
  }

  /* Devuelve el valor limpio o "--" cuando el campo viene nulo o vacio.
     Evita que la interfaz colapse con respuestas incompletas. */
  function valorSeguro(valor, porDefecto) {
    const texto = limpiarTexto(valor);
    return texto === '' ? (porDefecto || '--') : texto;
  }

  /* ------------------------------------------------------------------
     PETICION GENERICA
     ------------------------------------------------------------------ */
  async function pedirJSON(url) {
    // AbortController permite cortar la peticion si la API no responde.
    const control = new AbortController();
    const temporizador = setTimeout(function () { control.abort(); }, CONFIG.TIMEOUT_MS);

    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: control.signal
      });

      // Paso 1: control del codigo HTTP.
      if (!respuesta.ok) {
        return { ok: false, datos: null, error: mensajePorEstadoHTTP(respuesta.status) };
      }

      // Paso 2: parseo robusto. Si la API responde HTML (pagina de error o
      // de mantencion), JSON.parse lanza excepcion y se captura aqui.
      const textoPlano = await respuesta.text();
      if (!textoPlano || textoPlano.trim() === '') {
        return { ok: false, datos: null, error: 'El servidor devolvio una respuesta vacia. Intente mas tarde.' };
      }

      let json;
      try {
        json = JSON.parse(textoPlano);
      } catch (errorParseo) {
        return {
          ok: false,
          datos: null,
          error: 'La respuesta del servidor no tiene el formato esperado (JSON invalido). Intente mas tarde.'
        };
      }

      return { ok: true, datos: json, error: null };

    } catch (error) {
      // Paso 3: errores de red, CORS o timeout.
      if (error.name === 'AbortError') {
        return { ok: false, datos: null, error: 'La consulta demoro demasiado y fue cancelada. Verifique su conexion e intente nuevamente.' };
      }
      return {
        ok: false,
        datos: null,
        error: 'Servidor no disponible o sin conexion a internet. No fue posible contactar a Mercado Publico.'
      };
    } finally {
      clearTimeout(temporizador);
    }
  }

  /* ------------------------------------------------------------------
     ENDPOINT 1: LISTADO DE LICITACIONES
     .../licitaciones.json?fecha=ddmmaaaa&estado=nombre&ticket=cod
     ------------------------------------------------------------------ */
  async function obtenerLicitaciones(fechaDDMMAAAA, estado) {
    const parametros = new URLSearchParams();
    if (fechaDDMMAAAA) parametros.append('fecha', fechaDDMMAAAA);
    if (estado && estado !== 'todos') parametros.append('estado', estado);
    parametros.append('ticket', CONFIG.TICKET);

    const url = CONFIG.URL_LICITACIONES + '?' + parametros.toString();
    const resultado = await pedirJSON(url);
    if (!resultado.ok) return resultado;

    // Validacion de la estructura recibida: "Listado" debe ser un arreglo.
    const listado = Array.isArray(resultado.datos.Listado) ? resultado.datos.Listado : [];

    // Normalizacion: se limpian textos y se resuelven los campos nulos.
    const licitaciones = listado.map(function (item) {
      const codigoEstado = item.CodigoEstado;
      return {
        codigo: valorSeguro(item.CodigoExterno),
        nombre: valorSeguro(item.Nombre, 'Licitacion sin nombre informado'),
        estado: CONFIG.CODIGOS_ESTADO[codigoEstado] || 'Sin estado informado',
        fechaCierre: item.FechaCierre || null
      };
    });

    return { ok: true, datos: licitaciones, cantidad: resultado.datos.Cantidad || licitaciones.length, error: null };
  }

  /* ------------------------------------------------------------------
     ENDPOINT 3: DETALLE DE UNA LICITACION
     .../licitaciones.json?codigo=XXXX&ticket=cod
     ------------------------------------------------------------------ */
  async function obtenerDetalleLicitacion(codigo) {
    const parametros = new URLSearchParams({ codigo: codigo, ticket: CONFIG.TICKET });
    const url = CONFIG.URL_LICITACIONES + '?' + parametros.toString();

    const resultado = await pedirJSON(url);
    if (!resultado.ok) {
      return { ok: false, datos: null, error: 'Error al cargar detalles de la licitacion. Intente mas tarde. (' + resultado.error + ')' };
    }

    const listado = Array.isArray(resultado.datos.Listado) ? resultado.datos.Listado : [];
    if (listado.length === 0) {
      return { ok: false, datos: null, error: 'No se encontro informacion para la licitacion solicitada.' };
    }

    const d = listado[0];
    const fechas = d.Fechas || {};
    const comprador = d.Comprador || {};
    const adjudicacion = d.Adjudicacion || null;

    // Se arma un objeto plano, con "--" en cada campo que venga nulo/vacio.
    const detalle = {
      codigo: valorSeguro(d.CodigoExterno),
      nombre: valorSeguro(d.Nombre, 'Licitacion sin nombre informado'),
      descripcion: valorSeguro(d.Descripcion, 'La licitacion no registra descripcion.'),
      estado: valorSeguro(d.Estado || CONFIG.CODIGOS_ESTADO[d.CodigoEstado]),
      tipo: valorSeguro(d.Tipo),
      moneda: valorSeguro(d.Moneda),
      montoEstimado: d.MontoEstimado ? formatearMonto(d.MontoEstimado, d.Moneda) : '--',
      fechaCreacion: formatearFecha(fechas.FechaCreacion),
      fechaCierre: formatearFecha(fechas.FechaCierre || d.FechaCierre),
      fechaAdjudicacion: formatearFecha(fechas.FechaAdjudicacion),
      organismo: valorSeguro(comprador.NombreOrganismo),
      unidad: valorSeguro(comprador.NombreUnidad),
      rutUnidad: valorSeguro(comprador.RutUnidad),
      region: valorSeguro(comprador.RegionUnidad),
      comuna: valorSeguro(comprador.ComunaUnidad),
      contacto: valorSeguro(comprador.NombreUsuario),
      cargoContacto: valorSeguro(comprador.CargoUsuario),
      adjudicacionNumero: adjudicacion ? valorSeguro(adjudicacion.Numero) : '--',
      adjudicacionFecha: adjudicacion ? formatearFecha(adjudicacion.Fecha) : '--',
      items: Array.isArray(d.Items && d.Items.Listado) ? d.Items.Listado : []
    };

    return { ok: true, datos: detalle, error: null };
  }

  /* ------------------------------------------------------------------
     ENDPOINT 2: BUSQUEDA DE PROVEEDOR POR RUT
     .../Empresas/BuscarProveedor?rutempresaproveedor=XX.XXX.XXX-X&ticket=cod
     ------------------------------------------------------------------ */
  async function buscarProveedor(rutFormateado) {
    const parametros = new URLSearchParams({
      rutempresaproveedor: rutFormateado,
      ticket: CONFIG.TICKET
    });
    const url = CONFIG.URL_PROVEEDOR + '?' + parametros.toString();

    const resultado = await pedirJSON(url);
    if (!resultado.ok) return { ok: false, datos: null, error: resultado.error };

    // La API responde { Cantidad: n, listaEmpresas: [...] }.
    const lista = Array.isArray(resultado.datos.listaEmpresas) ? resultado.datos.listaEmpresas : [];

    // Validacion explicita de respuesta vacia (rubrica 2.1.2).
    if (lista.length === 0) {
      return { ok: true, datos: null, error: null, vacio: true };
    }

    const empresa = lista[0];
    return {
      ok: true,
      vacio: false,
      datos: {
        codigo: valorSeguro(empresa.CodigoEmpresa),
        razonSocial: valorSeguro(empresa.NombreEmpresa, 'Razon social no informada'),
        rut: rutFormateado
      },
      error: null
    };
  }

  /* ------------------------------------------------------------------
     UTILIDADES DE FORMATO
     ------------------------------------------------------------------ */
  function formatearFecha(valorIso) {
    if (!valorIso) return '--';
    const fecha = new Date(valorIso);
    if (isNaN(fecha.getTime())) return '--';
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const aaaa = fecha.getFullYear();
    const hh = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    return dd + '-' + mm + '-' + aaaa + ' ' + hh + ':' + min + ' hrs.';
  }

  function formatearMonto(monto, moneda) {
    const numero = Number(monto);
    if (isNaN(numero) || numero === 0) return '--';
    return numero.toLocaleString('es-CL') + ' ' + (moneda || 'CLP');
  }

  /* API publica del modulo */
  return {
    obtenerLicitaciones: obtenerLicitaciones,
    obtenerDetalleLicitacion: obtenerDetalleLicitacion,
    buscarProveedor: buscarProveedor,
    limpiarTexto: limpiarTexto,
    valorSeguro: valorSeguro,
    formatearFecha: formatearFecha
  };
})();
