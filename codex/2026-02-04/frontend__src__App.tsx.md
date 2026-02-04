Archivo: frontend/src/App.tsx

Diseño
- Layout de dos columnas: sidebar fijo y main con scroll vertical.
- Sidebar con secciones (Inventario, Operaciones, Sistema) y botones con icono + texto; colapsa en móvil.
- Botón flotante para menú en mobile (posición fija) y botón flotante de búsqueda (Command Palette).
- Área de contenido centrada con maxWidth 1400px y animación fadeIn.

Posibles errores / riesgos
- El estado inicial usa window.innerWidth y window.location.hash directamente; en renderizado no-browser (SSR) fallaría por referencia a window.
- No hay listener a cambios de hash; usar back/forward del navegador no actualiza la vista.
- Hay rutas duplicadas para usuarios: 'usuarios' y 'sys-users' apuntan a SystemUsersView, pero no hay navegación a 'usuarios' en el menú.

Mejoras concretas
- Agregar listener a hashchange para sincronizar view con navegación del navegador.
- Centralizar rutas y labels en una estructura para evitar duplicidad y facilitar permisos.
- Extraer estilos inline a clases/estilos reutilizables para consistencia y mantenibilidad.
