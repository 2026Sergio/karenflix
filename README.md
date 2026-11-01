# KarenFlix · Frontend

Interfaz web (HTML + CSS + JavaScript puro, sin frameworks) estilo IMDb, en blanco y limpia, para consumir la API de **KarenFlix Backend** (Node.js + Express + **MySQL**).

## Pantallas
| Archivo | Descripción |
|---|---|
| `index.html` | Inicio: carrusel destacado con "A continuación", chips de categorías, filas Top ranking / Populares / Recientes |
| `peliculas.html` | Listado con filtros por categoría, tipo, orden (recientes, ranking, popularidad) y búsqueda |
| `pelicula.html?id=` | Detalle, reseñas, like/dislike, crear/editar/eliminar tu reseña (1-10) |
| `login.html` | Registro e inicio de sesión (JWT) |
| `admin.html` | Panel admin: aprobar/rechazar propuestas, editar/eliminar títulos, CRUD de categorías |

Además: buscador del header con sugerencias en vivo, menú de categorías y modal para que cualquier usuario autenticado proponga títulos (quedan `pendiente` hasta que un admin los apruebe).

## Cómo ejecutarlo
1. Levanta el backend (`npm run dev`, por defecto en `http://localhost:3000`) con tu base MySQL creada con `database/script.sql`.
2. Si tu backend usa otra URL, edita `js/config.js`:
   ```js
   window.KF_API = 'http://localhost:3000/api/v1';
   ```
3. Sirve esta carpeta con cualquier servidor estático, por ejemplo:
   ```bash
   npx serve .        # o: python3 -m http.server 5500
   ```
4. En el `.env` del backend, `CORS_ORIGIN=*` funciona para desarrollo, o pon el origen del frontend (ej. `http://localhost:5500`).

## Endpoints que consume
`POST /auth/register`, `POST /auth/login`, `GET /categorias` (+ POST/PUT/DELETE admin), `GET /peliculas`, `GET /peliculas/ranking`, `GET /peliculas/:id`, `POST /peliculas`, `GET /peliculas/admin`, `PATCH /peliculas/:id/estado`, `PUT|DELETE /peliculas/:id`, `POST /peliculas/:id/resenas`, `PUT|DELETE /resenas/:id`, `POST /resenas/:id/reacciones`.

Los mensajes de validación que devuelve `express-validator` (`details[].mensaje`) se muestran tal cual en los formularios.

## Probar el panel admin
Regístrate normalmente y, en MySQL, promuévete a admin:
```sql
UPDATE usuarios SET rol = 'administrador' WHERE correo = 'tu@correo.com';
```
Vuelve a iniciar sesión para refrescar el token.

## Estructura
```
css/styles.css   estilos (variables, responsive)
js/config.js     URL del API
js/core.js       API, sesión, header/buscador, modales, tarjetas
js/home.js · peliculas.js · detalle.js · login.js · admin.js
```
