/**
 * ============================================================
 *  AgroCesar Shell — mfe-pedidos-mock.js
 *  Propietario: Walter Yesid Otero Torres
 *
 *  Cargador del MFE Seguimiento de Pedidos de Anderson.
 *  El pedidos.js de Anderson ya expone window.mountAgroSeguimiento
 *  y window.unmountAgroSeguimiento directamente. Este archivo
 *  gestiona la dependencia de Vue 3 (CDN global), inyecta el
 *  CSS del MFE en el Shell, y mide la performance de carga.
 * ============================================================
 */

(function () {
  const VUE_CDN_URL       = 'https://unpkg.com/vue@3/dist/vue.global.js';
  const PEDIDOS_JS_URL    = 'https://verdant-froyo-a4830a.netlify.app/pedidos.js';
  const PEDIDOS_CSS_URL   = 'https://verdant-froyo-a4830a.netlify.app/styles.css';
  const CARRITO_CSS_URL   = 'https://bespoke-entremet-48552c.netlify.app/styles.css';

  /**
   * Inyecta una hoja de estilos externa en el <head> del Shell.
   * Evita duplicados y no bloquea el mount si falla.
   * @param {string} href - URL del CSS a inyectar
   * @param {string} label - Etiqueta para logging
   * @returns {Promise<void>}
   */
  function cargarCSS(href, label) {
    return new Promise((resolve) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve(); // Ya está cargado
        return;
      }
      const inicio = performance.now();
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = href;
      link.onload = () => {
        console.log(`[AgroCesar] CSS ${label} cargado en ${Math.round(performance.now() - inicio)}ms`);
        resolve();
      };
      link.onerror = () => {
        console.warn(`[AgroPedidos] No se pudo cargar CSS: ${href}`);
        resolve(); // No bloquear el mount si el CSS falla
      };
      document.head.appendChild(link);
    });
  }

  /**
   * Carga un script externo dinámicamente con medición de
   * performance y manejo de errores.
   * @param {string} src - URL del script a cargar
   * @param {string} label - Etiqueta para los logs
   * @returns {Promise<void>}
   */
  function cargarScript(src, label) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const inicio = performance.now();
      const script = document.createElement('script');
      script.src = src;

      script.onload = () => {
        const duracion = Math.round(performance.now() - inicio);
        console.log(`[AgroCesar] ${label} cargado en ${duracion}ms`);
        resolve();
      };

      script.onerror = () => {
        const duracion = Math.round(performance.now() - inicio);
        console.error(`[AgroCesar] ❌ Error al cargar ${label} después de ${duracion}ms`);
        reject(new Error(`Fallo al cargar: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Carga Vue 3 desde CDN si aún no está disponible en window.
   * @returns {Promise<void>}
   */
  async function asegurarVue() {
    if (window.Vue) return;
    await cargarScript(VUE_CDN_URL, 'Vue 3 (CDN)');
  }

  /**
   * Carga el script de Pedidos de Anderson.
   * @returns {Promise<void>}
   */
  async function cargarPedidosJs() {
    if (window.mountAgroSeguimiento) return;
    await cargarScript(PEDIDOS_JS_URL, 'MFE Seguimiento de Pedidos');
  }

  /**
   * Punto de entrada principal: carga dependencias CSS + Vue + pedidos.js
   * en el orden correcto con medición de performance completa.
   */
  window.cargarMFEPedidos = async function () {
    // Cargar CSS de ambos MFEs de Anderson en paralelo (no bloquean)
    await Promise.all([
      cargarCSS(PEDIDOS_CSS_URL,  'MFE Pedidos (Anderson)'),
      cargarCSS(CARRITO_CSS_URL,  'MFE Carrito (Anderson)')
    ]);

    // Cargar Vue 3 primero, luego el script del MFE
    await asegurarVue();
    await cargarPedidosJs();
  };

  console.log('[AgroPedidos] Loader cargado. Llama window.cargarMFEPedidos() para inicializar.');
})();

