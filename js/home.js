KF.mount();

const chips = async () => {
  try {
    const { data } = await KF.api('/categorias');
    document.getElementById('chips').innerHTML = data.categorias.map((c) => `<a class="chip" href="peliculas.html?categoria_id=${c.id}">${KF.esc(c.nombre)}</a>`).join('');
  } catch { /* el error principal se muestra abajo */ }
};

const carousel = (items) => {
  const slider = document.getElementById('slider'), side = document.getElementById('upnext');
  if (!items.length) { slider.innerHTML = '<div class="empty" style="margin:30px;color:#cfd2da;border-color:#444">Aún no hay títulos aprobados. ¡Inicia sesión y propón el primero!</div>'; return; }
  let i = 0, timer;
  slider.innerHTML = items.map((p, n) => `
    <article class="slide ${n === 0 ? 'on' : ''}">
      <div class="bg" style="background-image:url('${KF.esc(p.imagen_url || '')}')"></div><div class="shade"></div>
      <div class="body">${KF.poster(p, 'poster')}
        <div><h2>${KF.esc(p.titulo)}</h2>
          <div class="meta"><span class="star">★ ${KF.num(p.promedio_calificacion).toFixed(1)}</span><span>${p.total_resenas} reseñas</span><span>${p.anio}</span><span>${KF.esc(KF.TIPOS[p.tipo])}</span><span>${KF.esc(p.categoria_nombre)}</span></div>
          <p>${KF.esc(p.descripcion)}</p>
          <a class="btn light" href="pelicula.html?id=${p.id}">Ver detalle y reseñas</a></div></div>
    </article>`).join('') +
    `<button class="arrow l" aria-label="Anterior">‹</button><button class="arrow r" aria-label="Siguiente">›</button>
     <div class="dots">${items.map((_, n) => `<i class="${n === 0 ? 'on' : ''}"></i>`).join('')}</div>`;
  const slides = slider.querySelectorAll('.slide'), dots = slider.querySelectorAll('.dots i');
  const renderSide = () => {
    const next = [1, 2, 3].slice(0, Math.min(3, items.length - 1)).map((k) => items[(i + k) % items.length]);
    side.innerHTML = next.map((p) => `
      <button class="up" data-id="${p.id}">${KF.poster(p)}<span><b>${KF.esc(p.titulo)}</b><small>★ ${KF.num(p.promedio_calificacion).toFixed(1)} · ${p.anio}</small></span></button>`).join('');
    side.querySelectorAll('.up').forEach((b) => b.addEventListener('click', () => go(items.findIndex((x) => x.id == b.dataset.id))));
  };
  const go = (n) => {
    i = (n + items.length) % items.length;
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    renderSide(); restart();
  };
  const restart = () => { clearInterval(timer); if (items.length > 1) timer = setInterval(() => go(i + 1), 6000); };
  slider.querySelector('.l').onclick = () => go(i - 1);
  slider.querySelector('.r').onclick = () => go(i + 1);
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', restart);
  renderSide(); restart();
};

const fill = (id, list, ranked) => {
  document.getElementById(id).innerHTML = list.length
    ? list.map((p, n) => KF.card(p, ranked ? n + 1 : 0)).join('')
    : '<div class="empty" style="grid-column:1/-1">Sin títulos todavía.</div>';
};

(async () => {
  chips();
  try {
    const [top, pop, rec] = await Promise.all([
      KF.api('/peliculas/ranking?limite=12'),
      KF.api('/peliculas/ranking?orden=popularidad&limite=12'),
      KF.api('/peliculas?orden=recientes'),
    ]);
    carousel(top.data.ranking.slice(0, 5));
    fill('rowTop', top.data.ranking, true);
    fill('rowPop', pop.data.ranking, false);
    fill('rowNew', rec.data.peliculas.slice(0, 12), false);
  } catch (e) {
    document.getElementById('slider').innerHTML = `<div style="padding:30px;width:100%">${KF.errHtml(e)}</div>`;
  }
})();
