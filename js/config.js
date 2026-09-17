/* ==========================================================================
   config.js - Configuracion global del aplicativo LicitaSeguro
   --------------------------------------------------------------------------
   Se centraliza aqui todo lo que puede cambiar (ticket, URLs, tamaño de
   pagina) para no repetir literales en el resto del codigo (principio DRY).
   ========================================================================== */

'use strict';

const CONFIG = Object.freeze({
  /* Ticket entregado en el documento "Apoyo para consumo de API". */
  TICKET: 'AC3A098B-4CD0-41AF-81A5-41284248419B',

  /* Endpoint 1 y 3: listado y detalle comparten la misma ruta, cambia el
     parametro (fecha+estado para el listado, codigo para el detalle). */
  URL_LICITACIONES: 'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json',

  /* Endpoint 2: busqueda de proveedor por RUT. */
  URL_PROVEEDOR: 'https://api.mercadopublico.cl/servicios/v1/Publico/Empresas/BuscarProveedor',

  /* Tarea 3: se pagina cuando la respuesta trae mas de 10 elementos. */
  ITEMS_POR_PAGINA: 10,

  /* Tiempo maximo de espera de una peticion antes de abortarla (ms). */
  TIMEOUT_MS: 20000,

  /* Estados validos segun la documentacion oficial de la API de
     Mercado Publico (parametro "estado" del endpoint de listado). */
  ESTADOS: [
    { valor: 'activas',     texto: 'Activas' },
    { valor: 'cerradas',    texto: 'Cerradas' },
    { valor: 'desiertas',   texto: 'Desiertas' },
    { valor: 'adjudicadas', texto: 'Adjudicadas' },
    { valor: 'revocadas',   texto: 'Revocadas' },
    { valor: 'suspendidas', texto: 'Suspendidas' },
    { valor: 'todos',       texto: 'Todos los estados' }
  ],

  /* Mapa CodigoEstado -> etiqueta legible. La API devuelve un numero en el
     listado y un texto en el detalle; aqui se normaliza. */
  CODIGOS_ESTADO: {
    5: 'Publicada',
    6: 'Cerrada',
    7: 'Desierta',
    8: 'Adjudicada',
    // 14: se informa como "Revocada" en los ejemplos de la API
    14: 'Revocada',
    15: 'Revocada',
    16: 'Suspendida',
    17: 'En evaluacion',
    18: 'Cancelada',
    19: 'Readjudicada',
    20: 'Fallo pendiente'
  }
});
