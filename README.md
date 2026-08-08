# 🇦🇷 Guardian AR

Prototipo web de ciberseguridad responsable.

## Funciones

- Analizador de dominios con indicadores **simulados**.
- Barra de riesgo 0–100.
- Guardado local mediante `localStorage`.
- Exportación de informes PDF.
- Exportación/importación JSON para compartir informes.
- Biblioteca local.
- Buscador de fuentes públicas/legales.
- Modo Comunidad con mini-juegos.
- Modo Operador como simulación educativa.

## Importante

Esta versión no rastrea, descarga, almacena ni muestra material ilegal. El motor de riesgo usa datos simulados.

Una biblioteca pública real requeriría backend, autenticación, moderación, controles de privacidad y mecanismos de reporte.

## GitHub Pages

Subí `index.html`, `styles.css`, `app.js` y `logo.png` al repositorio. Después activá GitHub Pages desde:

Settings → Pages → Deploy from branch → `main` → `/ (root)`.

El archivo `logo.png` debe estar en la raíz del repositorio.


## Verificación REAL de reputación

La app incluye una integración opcional con Google Safe Browsing. Safe Browsing permite comprobar URLs contra listas de recursos web inseguros; la API es para uso no comercial. citeturn0search0turn0search3

No pongas la API key en `app.js` ni en GitHub. Usá `worker.js` como backend (por ejemplo, Cloudflare Worker), guardando la clave como secreto `SAFE_BROWSING_KEY`, y luego configurá `window.GUARDIAN_API_URL` en `app.js`.

Esta función solo verifica la URL concreta. No rastrea enlaces, no descarga archivos y no inspecciona contenido sensible.

## Juego

La sección Comunidad ahora tiene **Guardian AR: Copa Digital**, un mini juego de penales con preguntas de seguridad digital.
