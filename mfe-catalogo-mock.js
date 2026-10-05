/**
 * ============================================================
 *  AgroCesar Shell — mfe-catalogo-mock.js
 *  Propietario: Walter Yesid Otero Torres
 *
 *  Wrapper del MFE Catálogo de Camilo (Preact ESM).
 *  El catalogo.js de Camilo es un ES Module que exporta
 *  `Catalogo` como named export. Este wrapper carga el módulo
 *  dinámicamente, inyecta el CSS del MFE en el Shell, y
 *  expone window.mountAgroCatalogo / window.unmountAgroCatalogo.
 * ============================================================
 */

(function () {
  const BASE_URL         = 'https://agrocesarcatalogo.netlify.app';
  const CATALOGO_JS_URL  = `${BASE_URL}/catalogo.js`;
  const CATALOGO_CSS_URL = `${BASE_URL}/styles.css`;
  const PREACT_CDN       = 'https://unpkg.com/htm/preact/standalone.module.js';

  // Guardar referencias activas para unmount limpio
  const activeRoots = new Map();

  /**
   * Inyecta una hoja de estilos externa en el <head> del Shell.
   * Evita duplicados comprobando si ya existe el link.
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
        console.warn(`[AgroCatalogo] No se pudo cargar CSS: ${href}`);
        resolve(); // No bloquear el mount si el CSS falla
      };
      document.head.appendChild(link);
    });
  }

  const STORAGE_KEY = 'agro_productos_publicados';

  /**
   * Obtiene la lista de productos publicados almacenados en localStorage.
   * @returns {Array}
   */
  function obtenerProductosPublicados() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Guarda un nuevo producto publicado asegurando no duplicar por ID.
   * @param {Object} producto
   */
  function guardarProductoPublicado(producto) {
    if (!producto || !producto.id) return;
    const lista = obtenerProductosPublicados();
    if (!lista.some(p => p.id === producto.id)) {
      lista.push(producto);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
        console.log('[AgroCatalogo] 💾 Producto guardado en store global del Shell:', producto.nombre);
      } catch (_) {}
    }
  }

  // Escuchar globalmente en todo momento, incluso cuando Catálogo no esté montado
  window.addEventListener('producto:publicado', (event) => {
    if (event.detail && !event.detail._rehidratado) {
      guardarProductoPublicado(event.detail);
    }
  });

  /**
   * Monta el MFE Catálogo en el contenedor especificado.
   * @param {string} containerId - ID del elemento DOM contenedor
   * @param {Object} [props] - Props opcionales: { bffUrl }
   */
  window.mountAgroCatalogo = async function (containerId, props = {}) {
    const container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;

    if (!container) {
      console.error(`[AgroCatalogo] Contenedor '${containerId}' no encontrado.`);
      return;
    }

    // Limpiar instancia previa si existe
    if (window.unmountAgroCatalogo) {
      window.unmountAgroCatalogo(containerId);
    }

    try {
      // 1. Inyectar CSS del MFE Catálogo antes de renderizar
      await cargarCSS(CATALOGO_CSS_URL, 'MFE Catálogo (Camilo)');

      // 2. Importar dinámicamente el módulo ESM de Camilo
      const { Catalogo } = await import(CATALOGO_JS_URL);

      // 3. Importar render de preact standalone
      const { render, html } = await import(PREACT_CDN);

      // 4. Asegurar contenedor limpio y renderizar
      container.innerHTML = '';
      render(html`<${Catalogo} bffUrl=${props.bffUrl || ''} />`, container);

      // Guardar referencia para desmontaje limpio
      activeRoots.set(containerId, { render, container });

      // 5. Rehidratar productos creados asegurando que Preact haya terminado el mount
      const rehidratar = () => {
        const guardados = obtenerProductosPublicados();
        if (!guardados.length) return;

        let intentos = 0;
        const interval = setInterval(() => {
          intentos++;
          let faltan = 0;

          guardados.forEach(prod => {
            // Verificar si el producto ya fue renderizado en el catálogo
            const yaEnDom = container.textContent && container.textContent.includes(prod.nombre);
            if (!yaEnDom) {
              faltan++;
              window.dispatchEvent(new CustomEvent('producto:publicado', {
                detail: { ...prod, _rehidratado: true }
              }));
            }
          });

          // Si todos los productos ya están en el DOM o pasaron 6 intentos (1.8s), detener
          if (faltan === 0 || intentos >= 6) {
            clearInterval(interval);
          }
        }, 300);
      };

      // Iniciar rehidratación tras el render inicial
      setTimeout(rehidratar, 100);

      console.log(`[AgroCatalogo] Montado con éxito en #${containerId}`);
    } catch (err) {
      console.error('[AgroCatalogo] Error al montar:', err);
      throw err; // Dejar que el Shell maneje el error de resiliencia
    }
  };

  /**
   * Desmonta el MFE Catálogo del contenedor especificado.
   * @param {string} containerId - ID del elemento DOM contenedor
   */
  window.unmountAgroCatalogo = function (containerId) {
    const targetId = typeof containerId === 'string' ? containerId : containerId.id;

    if (activeRoots.has(targetId)) {
      const { render, container } = activeRoots.get(targetId);
      try {
        render(null, container);
      } catch (_) { /* Ignorar errores de desmontaje */ }
      container.innerHTML = '';
      activeRoots.delete(targetId);
      console.log(`[AgroCatalogo] Desmontado de #${targetId}`);
    }
  };

  console.log('[AgroCatalogo] Wrapper cargado. Funciones mount/unmount disponibles en window.');
})();
