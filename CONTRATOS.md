# CONTRATOS.md — Matriz de Contratos MFE
## AgroCesar Marketplace | Grupo 4
**Propietario / Árbitro:** Walter Yesid Otero Torres (App Shell)  
**Versión:** 1.0.0 | Fecha: 2026-10-05

> Este documento es la fuente de verdad para la integración entre Micro Frontends.
> Ningún equipo puede modificar unilateralmente un contrato ya publicado.
> Los cambios deben ser aprobados por el árbitro antes de publicarse en producción.

---

## 1. URLs de Producción

| MFE | Propietario | URL Producción | Script Entry |
|-----|-------------|---------------|--------------|
| **Catálogo** | Camilo (Preact) | `https://agrocesarcatalogo.netlify.app/` | `catalogo.js` (ESM) |
| **Operaciones (Panel Productor)** | Equipo Operaciones (React 18) | `https://agrocesar-operaciones.netlify.app/` | `main.js` (ESM) |
| **Carrito / Logística** | Anderson (Svelte) | `https://bespoke-entremet-48552c.netlify.app/` | `logistica.js` |
| **Seguimiento de Pedidos** | Anderson (Vue 3) | `https://verdant-froyo-a4830a.netlify.app/` | `pedidos.js` |
| **App Shell** | Walter (Vanilla JS) | TBD (GitHub Pages / Netlify) | `index.html` |

---

## 2. Firmas de Ciclo de Vida (mount / unmount)

### 2.1 MFE Catálogo — Camilo (Preact)

```js
// El Shell inyecta el ESM y luego llama:
window.mountAgroCatalogo(containerId: string, props?: { bffUrl?: string }): void

// Para desmontar:
window.unmountAgroCatalogo(containerId: string): void
```

**Tecnología:** Preact + htm via CDN ESM (`https://unpkg.com/htm/preact/standalone.module.js`)  
**Modo de carga:** `<script type="module">` con import dinámico

### 2.2 MFE Seguimiento de Pedidos — Anderson (Vue 3)

```js
// Requiere que window.Vue esté cargado ANTES de este script
// CDN: https://unpkg.com/vue@3/dist/vue.global.js

window.mountAgroSeguimiento(
  containerId: string,         // ID del elemento DOM contenedor
  props?: {
    pedidoId?: string,         // ID del pedido (opcional, puede llegar vía evento)
    total?: number,            // Total del pedido
    conductorId?: string       // ID del conductor (v2)
  }
): void

window.unmountAgroSeguimiento(containerId: string): void
```

**Tecnología:** Vue 3 via CDN global (`window.Vue`)  
**Dependencia previa:** `<script src="https://unpkg.com/vue@3/dist/vue.global.js">` debe cargarse primero

### 2.3 MFE Operaciones / Panel Productor — (React 18)

```js
// El Shell inyecta el ESM main.js y luego invoca:
window.mountAgroOperaciones(
  containerId: string,
  props?: {
    usuario?: { nombre: string, rol: string, token?: string }
  }
): void

// Para desmontar:
window.unmountAgroOperaciones(containerId: string): void
```

**Tecnología:** React 18 + ReactDOM + htm via CDN ESM (`https://esm.sh/react@18.2.0`)  
**Modo de carga:** Dynamic `import('https://agrocesar-operaciones.netlify.app/main.js')`  
**Estilos:** Inyecta automáticamente `styles.css` del MFE

### 2.4 MFE Carrito / Logística — Anderson (Svelte)

```js
// Carga directa mediante script logistica.js:
window.mountAgroLogistica(containerId: string, props?: { offlineMode?: boolean }): void
window.unmountAgroLogistica(containerId: string): void
```

---

## 3. Eventos del Sistema (CustomEvents)

| Evento | Versión | Emisor | Receptor(es) | Payload |
|--------|---------|--------|--------------|---------|
| `carrito:agregado` | v1 | MFE Catálogo | MFE Carrito | `{ idProducto, cantidad, nombre, precio }` |
| `producto:publicado` | v1 | **MFE Operaciones** | MFE Catálogo / Shell | `{ id, nombre, precio, productor, categoria, imagen }` |
| `pedido:confirmado` | v1 | MFE Carrito | MFE Seguimiento | `{ pedidoId, total }` |
| `pedido:confirmado:v2` | v2 ✅ retrocompat. | MFE Carrito | MFE Seguimiento | `{ pedidoId, total, idConductor }` |
| `pedido:estado` | v1 | MFE Seguimiento | **Shell** (Toast) | `{ pedidoId, estado }` |

### 3.1 Detalle de Payloads

#### `carrito:agregado` (v1)
```js
new CustomEvent('carrito:agregado', {
  detail: {
    idProducto: number,   // ID del producto
    cantidad: number,     // Siempre 1 en v1
    nombre: string,       // Nombre del producto
    precio: number        // Precio en COP
  }
})
```

#### `pedido:confirmado` (v1) — Retrocompatible con v2
```js
new CustomEvent('pedido:confirmado', {
  detail: {
    pedidoId: string,     // Ej: "PED-1234"
    total: number         // Total en COP
  }
})
```

#### `pedido:confirmado:v2` (v2)
```js
new CustomEvent('pedido:confirmado:v2', {
  detail: {
    pedidoId: string,     // Ej: "PED-1234"
    total: number,        // Total en COP
    idConductor: string   // Ej: "COND-99 (Juan Pérez)"
  }
})
```

#### `pedido:estado` (v1) — Escuchado por el Shell para mostrar Toast
```js
new CustomEvent('pedido:estado', {
  detail: {
    pedidoId: string,     // Ej: "PED-1234"
    estado: string        // "Recibido" | "En preparación" | "En camino" | "Entregado"
  },
  bubbles: true
})
```

---

## 4. Estados del Ciclo de Vida de un Pedido

```
Recibido → En preparación → En camino → Entregado
```

Cada transición emite un evento `pedido:estado`. El Shell captura cada uno y muestra una notificación Toast.

---

## 5. Reglas de Gobernanza

1. **El Shell es árbitro:** Solo Walter puede modificar las URLs de carga de los MFEs en `index.html`.
2. **Retrocompatibilidad obligatoria:** Si se versiona un evento (v2), el MFE emisor debe seguir soportando el listener de la v1.
3. **Tokens CSS:** Solo `tokens.css` del Shell define las variables CSS. Los MFEs las consumen, no las redefinen.
4. **Ciclo de vida limpio:** Cada MFE debe limpiar sus `setInterval` y `addEventListener` en su función `unmount`.
5. **Pruebas de contrato:** Antes de integrar, cada MFE debe pasar las aserciones en `contrato.html`.

---

## 6. Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-10-05 | 1.0.0 | Creación inicial del contrato | Walter Yesid Otero Torres |
