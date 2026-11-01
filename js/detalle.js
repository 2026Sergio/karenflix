KF.mount();
const id = KF.qs('id'), root = document.getElementById('detail'), me = KF.user();
let rating = 0;

const reviewHtml = (r) => {
  const own = me && me.id === r.usuario_id;
  return `<article class="review" data-id="${r.id}">
    <div class="top"><div><h4>${KF.esc(r.titulo)}</h4><div class="by">${KF.esc(r.autor_nombre)} · ${KF.fmtDate(r.fecha_creacion)}</div></div>
      <span class="rate"><span class="star">★</span>${r.calificacion}/10</span></div>
    <p>${KF.esc(r.comentario)}</p>
    <div class="acts">
      <button class="pill" data-r="like" ${own ? 'disabled title="No puedes reaccionar a tu propia reseña"' : ''}>👍 ${r.total_likes}</button>
      <button class="pill" data-r="dislike" ${own ? 'disabled title="No puedes reaccionar a tu propia reseña"' : ''}>👎 ${r.total_dislikes}</button>
      ${own ? '<span class="tag">Tu reseña</span>' : ''}</div></article>`;
};

const render = async () => {
  let data;
  try { ({ data } = await KF.api(`/peliculas/${id}`)); }
  catch (e) { root.innerHTML = `<div class="wrap" style="padding:30px 20px">${KF.errHtml(e)}<a class="btn ghost" href="peliculas.html">Volver al listado</a></div>`; return; }
  const { pelicula: p, resenas } = data;
  document.title = `KarenFlix · ${p.titulo}`;
  const mine = me && resenas.find((r) => r.usuario_id === me.id);
  rating = mine ? mine.calificacion : 0;

  root.innerHTML = `
  <section class="detail-top"><div class="wrap">
    ${KF.poster(p, 'poster')}
    <div><h1>${KF.esc(p.titulo)}</h1>
      <div class="meta"><span>${p.anio}</span><span>${KF.esc(KF.TIPOS[p.tipo])}</span><span>${KF.esc(p.categoria_nombre)}</span><span>Propuesto por ${KF.esc(p.creador_nombre)}</span></div>
      <p class="desc">${KF.esc(p.descripcion)}</p>
      <div class="scores">
        <div class="score"><b class="star">★ ${KF.num(p.total_resenas) ? KF.num(p.promedio_calificacion).toFixed(1) : '–'}</b><small>${p.total_resenas} reseñas</small></div>
        <div class="score"><b>${KF.num(p.puntaje_ranking).toFixed(2)}</b><small>Puntaje ranking</small></div>
      </div></div>
  </div></section>
  <main class="wrap cols">
    <section><div class="sec-h"><h2>Reseñas</h2></div>
      ${resenas.length ? resenas.map(reviewHtml).join('') : '<div class="empty">Aún no hay reseñas. ¡Sé el primero en opinar!</div>'}</section>
    <aside class="panel" id="panel">${
      !me ? '<h3>Escribe tu reseña</h3><p style="margin-bottom:14px;color:var(--muted)">Inicia sesión para calificar y opinar.</p><a class="btn" href="login.html">Iniciar sesión</a>'
      : `<h3>${mine ? 'Editar tu reseña' : 'Escribe tu reseña'}</h3><div id="formErr"></div>
        <form id="rf" novalidate>
          <div class="field"><label>Calificación</label><div class="nums">${[...Array(10)].map((_, n) => `<button type="button" data-n="${n + 1}" class="${rating === n + 1 ? 'on' : ''}">${n + 1}</button>`).join('')}</div></div>
          <div class="field"><label for="rt">Título</label><input id="rt" name="titulo" maxlength="100" value="${KF.esc(mine?.titulo)}"></div>
          <div class="field"><label for="rc">Comentario</label><textarea id="rc" name="comentario">${KF.esc(mine?.comentario)}</textarea></div>
          <div style="display:flex;gap:8px"><button class="btn" style="flex:1">${mine ? 'Guardar cambios' : 'Publicar reseña'}</button>
          ${mine ? '<button type="button" class="btn danger" id="del">Eliminar</button>' : ''}</div>
        </form>`}</aside>
  </main>`;

  // Reacciones
  root.querySelectorAll('.review [data-r]').forEach((b) => b.addEventListener('click', async () => {
    if (!me) return (location.href = 'login.html');
    try { await KF.api(`/resenas/${b.closest('.review').dataset.id}/reacciones`, { method: 'POST', body: { tipo: b.dataset.r } }); render(); }
    catch (e) { KF.toast(e.message, true); }
  }));

  if (!me) return;
  root.querySelectorAll('.nums button').forEach((b) => b.addEventListener('click', () => {
    rating = Number(b.dataset.n);
    root.querySelectorAll('.nums button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  document.getElementById('rf').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = Object.fromEntries(new FormData(ev.target)); f.calificacion = rating || undefined;
    try {
      const r = await KF.api(mine ? `/resenas/${mine.id}` : `/peliculas/${id}/resenas`, { method: mine ? 'PUT' : 'POST', body: f });
      await render(); KF.toast(r.message);
    } catch (e) { document.getElementById('formErr').innerHTML = KF.errHtml(e); }
  });
  document.getElementById('del')?.addEventListener('click', () => KF.confirm('¿Eliminar tu reseña? La calificación de la película se recalculará.', async () => {
    const r = await KF.api(`/resenas/${mine.id}`, { method: 'DELETE' }); await render(); KF.toast(r.message);
  }));
};
render();
