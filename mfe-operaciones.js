/**
 * ============================================================
 *  AgroCesar Shell — mfe-operaciones.js
 *  Propietario: Walter Yesid Otero Torres (Shell Orchestrator)
 *
 *  Cargador y adaptador del MFE Operaciones / Panel Productor.
 *  El módulo de Operaciones está construido en React 18 + htm
 *  y expone window.mountAgroOperaciones y window.unmountAgroOperaciones.
 * ============================================================
 */

(function () {
  'use strict';

  const OPERACIONES_URL = 'https://agrocesar-operaciones.netlify.app/main.js';
  const OPERACIONES_CSS = 'https://agrocesar-operaciones.netlify.app/styles.css';

  let cargado = false;

  /**
   * Inyecta los estilos CSS de Operaciones en el <head> del Shell si no existen.
   */
  function cargarCSS() {
    if (!document.getElementById('agro-op-styles')) {
      const link = document.createElement('link');
      link.id = 'agro-op-styles';
      link.rel = 'stylesheet';
      link.href = OPERACIONES_CSS;
      document.head.appendChild(link);
    }
  }

  /**
   * Carga el módulo de Operaciones dinámicamente y expone los métodos en window.
   */
  window.cargarMFEOperaciones = async function () {
    if (cargado && window.mountAgroOperaciones) return;

    cargarCSS();

    const inicio = performance.now();
    try {
      await import(OPERACIONES_URL);
      cargado = true;
      const duracion = Math.round(performance.now() - inicio);
      console.log(`[AgroCesar Shell] 📦 MFE Operaciones cargado en ${duracion}ms`);
    } catch (err) {
      console.error('[AgroCesar Shell] ❌ Error al cargar MFE Operaciones:', err);
      throw err;
    }
  };

  console.log('[AgroCesar Shell] Loader de MFE Operaciones disponible.');
})();
