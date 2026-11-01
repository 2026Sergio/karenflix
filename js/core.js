/* KarenFlix - utilidades compartidas: API, sesion, layout, modales */
const KF = {};

/* ---------- Helpers ---------- */
KF.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
KF.num = (v) => Number(v) || 0;
KF.fmtDate = (d) => new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
KF.qs = (k) => new URLSearchParams(location.search).get(k);
KF.initials = (t) => KF.esc(String(t).split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase());
KF.TIPOS = { pelicula: 'Película', serie: 'Serie', anime: 'Anime' };

KF.poster = (p, cls = '') => p.imagen_url
  ? `<img class="${cls}" src="${KF.esc(p.imagen_url)}" alt="Póster de ${KF.esc(p.titulo)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph ${cls}&quot;>${KF.initials(p.titulo)}</div>'">`
  : `<div class="ph ${cls}">${KF.initials(p.titulo)}</div>`;

KF.rating = (p) => KF.num(p.total_resenas) > 0
  ? `<span class="rate"><span class="star">★</span>${KF.num(p.promedio_calificacion).toFixed(1)}</span>`
  : `<span class="rate" style="color:var(--muted)"><span>☆</span>Sin reseñas</span>`;

KF.card = (p, rank) => `
  <a class="card" href="pelicula.html?id=${p.id}">
    <div class="img">${KF.poster(p)}${rank ? `<span class="rank">#${rank}</span>` : ''}</div>
    <div class="info">${KF.rating(p)}<span class="t">${KF.esc(p.titulo)}</span>
    <span class="s">${p.anio} · ${KF.esc(KF.TIPOS[p.tipo] || p.tipo)} · ${KF.esc(p.categoria_nombre)}</span></div>
  </a>`;

/* ---------- Sesion ---------- */
KF.token = () => localStorage.getItem('kf_token');
KF.user = () => { try { return JSON.parse(localStorage.getItem('kf_user')); } catch { return null; } };
KF.setSession = (usuario, token) => { localStorage.setItem('kf_token', token); localStorage.setItem('kf_user', JSON.stringify(usuario)); };
KF.logout = () => { localStorage.removeItem('kf_token'); localStorage.removeItem('kf_user'); location.href = 'index.html'; };
KF.isAdmin = () => KF.user()?.rol === 'administrador';

/* ---------- API ---------- */
KF.api = async (path, { method = 'GET', body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (KF.token()) headers.Authorization = `Bearer ${KF.token()}`;
  let res;
  try {
    res = await fetch(KF_API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.'), { details: [] });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && KF.token()) { localStorage.removeItem('kf_token'); localStorage.removeItem('kf_user'); }
    throw Object.assign(new Error(json.message || 'Error inesperado.'), { details: json.details || [], status: res.status });
  }
  return json;
};

/* ---------- UI: errores, toasts, modal ---------- */
KF.errHtml = (e) => `<div class="err" role="alert">${KF.esc(e.message)}${e.details?.length
  ? `<ul>${e.details.map((d) => `<li>${KF.esc(d.mensaje)}</li>`).join('')}</ul>` : ''}</div>`;

KF.toast = (msg, bad) => {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : '');
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3200);
};

KF.modal = (title, html, onSubmit, { submitText = 'Guardar', hideCancel = false } = {}) => {
  const d = document.createElement('dialog');
  d.innerHTML = `<form method="dialog" novalidate><h3>${KF.esc(title)}</h3><div class="slot-err"></div>${html}
    <div class="dlg-acts">${hideCancel ? '' : '<button type="button" class="btn ghost" data-x>Cancelar</button>'}
    <button class="btn" type="submit">${KF.esc(submitText)}</button></div></form>`;
  document.body.append(d);
  const form = d.querySelector('form');
  d.querySelector('[data-x]')?.addEventListener('click', () => d.close());
  d.addEventListener('close', () => d.remove());
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try { await onSubmit(Object.fromEntries(new FormData(form)), d); }
    catch (e) { d.querySelector('.slot-err').innerHTML = KF.errHtml(e); }
    btn.disabled = false;
  });
  d.showModal();
  return d;
};

KF.confirm = (msg, onYes) => KF.modal('Confirmar', `<p style="margin-bottom:18px">${KF.esc(msg)}</p>`, async (_, d) => { await onYes(); d.close(); }, { submitText: 'Sí, continuar' });

/* ---------- Formulario de pelicula (crear / editar) ---------- */
KF.movieForm = async (p, onDone) => {
  const { data } = await KF.api('/categorias');
  const opts = data.categorias.map((c) => `<option value="${c.id}" ${p?.categoria_id === c.id ? 'selected' : ''}>${KF.esc(c.nombre)}</option>`).join('');
  const html = `
    <div class="field"><label>Título</label><input name="titulo" maxlength="150" value="${KF.esc(p?.titulo)}" required></div>
    <div class="field"><label>Descripción</label><textarea name="descripcion" required>${KF.esc(p?.descripcion)}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>Tipo</label><select name="tipo">${Object.entries(KF.TIPOS).map(([k, v]) => `<option value="${k}" ${p?.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Año</label><input name="anio" type="number" min="1888" max="2100" value="${p?.anio ?? new Date().getFullYear()}" required></div>
    </div>
    <div class="field"><label>Categoría</label><select name="categoria_id" required>${opts}</select></div>
    <div class="field"><label>URL de la imagen (opcional)</label><input name="imagen_url" type="url" maxlength="500" value="${KF.esc(p?.imagen_url)}" placeholder="https://..."></div>`;
  KF.modal(p ? 'Editar título' : 'Proponer película o serie', html, async (v, d) => {
    v.categoria_id = Number(v.categoria_id); v.anio = Number(v.anio);
    if (!v.imagen_url) delete v.imagen_url;
    const r = p ? await KF.api(`/peliculas/${p.id}`, { method: 'PUT', body: v }) : await KF.api('/peliculas', { method: 'POST', body: v });
    d.close(); KF.toast(r.message); onDone?.();
  }, { submitText: p ? 'Guardar cambios' : 'Enviar propuesta' });
};

/* ---------- Layout: header + footer + buscador ---------- */
KF.mount = async (active) => {
  const u = KF.user();
  document.getElementById('app-header').outerHTML = `
  <header class="hdr"><div class="wrap">
    <a href="index.html" class="logo" aria-label="KarenFlix, inicio">KarenFlix</a>
    <button class="menu-btn" id="menuBtn" aria-haspopup="true">☰ <span>Menú</span></button>
    <form class="search" id="searchForm" role="search" autocomplete="off">
      <select id="searchTipo" aria-label="Tipo"><option value="">Todo</option>
        ${Object.entries(KF.TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <input id="searchInput" placeholder="Buscar en KarenFlix" aria-label="Buscar">
      <button aria-label="Buscar">buscar</button>
      <div class="suggest hidden" id="suggest"></div>
    </form>
    <nav class="nav">
      <a href="peliculas.html" class="hide-sm ${active === 'lista' ? 'on' : ''}">Explorar</a>
      ${u ? `<button class="link hide-sm" id="proposeBtn">+ Proponer</button>` : ''}
      ${KF.isAdmin() ? '<a href="admin.html">Panel admin</a>' : ''}
      ${u ? `<button class="link" id="logoutBtn" title="Cerrar sesión">${KF.esc(u.nombre)} · Salir</button>`
          : '<a href="login.html" class="cta">Iniciar sesión</a>'}
    </nav>
  </div></header>`;
  const f = document.getElementById('app-footer');
  if (f) f.outerHTML = `<footer class="ftr"><div class="wrap">KarenFlix · Reseñas y rankings de cine, series y anime geek · API v1 + MySQL</div></footer>`;

  document.getElementById('logoutBtn')?.addEventListener('click', KF.logout);
  document.getElementById('proposeBtn')?.addEventListener('click', () => KF.movieForm(null));

  // Menu de categorias
  let drop;
  document.getElementById('menuBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (drop) { drop.remove(); drop = null; return; }
    drop = document.createElement('div'); drop.className = 'drop';
    drop.innerHTML = '<h4>Categorías</h4><p class="spin">Cargando…</p>';
    document.querySelector('.hdr .wrap').append(drop);
    try {
      const { data } = await KF.api('/categorias');
      drop.innerHTML = '<h4>Explorar</h4><a href="peliculas.html?orden=ranking"> Ranking general</a><a href="peliculas.html?orden=popularidad"> Más populares</a><h4>Categorías</h4>' +
        (data.categorias.map((c) => `<a href="peliculas.html?categoria_id=${c.id}">${KF.esc(c.nombre)}</a>`).join('') || '<p class="spin">Sin categorías</p>');
    } catch (er) { drop.innerHTML = KF.errHtml(er); }
  });
  document.addEventListener('click', () => { drop?.remove(); drop = null; document.getElementById('suggest')?.classList.add('hidden'); });

  // Buscador con sugerencias
  const form = document.getElementById('searchForm'), input = document.getElementById('searchInput'),
    tipo = document.getElementById('searchTipo'), box = document.getElementById('suggest');
  input.value = KF.qs('busqueda') || ''; tipo.value = KF.qs('tipo') || '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams(); if (input.value.trim()) p.set('busqueda', input.value.trim()); if (tipo.value) p.set('tipo', tipo.value);
    location.href = 'peliculas.html?' + p;
  });
  let timer;
  const suggest = async () => {
    const q = input.value.trim();
    if (q.length < 2) return box.classList.add('hidden');
    try {
      const p = new URLSearchParams({ busqueda: q }); if (tipo.value) p.set('tipo', tipo.value);
      const { data } = await KF.api('/peliculas?' + p);
      box.innerHTML = data.peliculas.slice(0, 6).map((m) => `<a href="pelicula.html?id=${m.id}">${KF.poster(m)}<div><b>${KF.esc(m.titulo)}</b><small>${m.anio} · ${KF.esc(KF.TIPOS[m.tipo])}</small></div></a>`).join('') || '<p>Sin resultados</p>';
      box.classList.remove('hidden');
    } catch { box.classList.add('hidden'); }
  };
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(suggest, 250); });
  form.addEventListener('click', (e) => e.stopPropagation());
};
