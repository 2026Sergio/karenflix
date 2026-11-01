KF.mount();
const content = document.getElementById('content');
if (!KF.isAdmin()) {
  document.getElementById('adminRoot').innerHTML = `<div class="page-h"><h1>Acceso restringido</h1><p>Esta sección es solo para administradores.</p><br><a class="btn" href="login.html">Iniciar sesión</a></div>`;
} else {
  let tab = 'pendiente';
  const tabs = document.getElementById('tabs');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    tab = b.dataset.t; tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); load();
  });

  const act = (fn, okMsg) => async () => { try { const r = await fn(); KF.toast(r?.message || okMsg); load(); } catch (e) { KF.toast(e.message, true); } };

  const loadMovies = async () => {
    const { data } = await KF.api('/peliculas/admin?estado=' + tab);
    const list = data.peliculas;
    if (!list.length) return (content.innerHTML = `<div class="empty">No hay títulos ${tab === 'pendiente' ? 'pendientes' : tab === 'aprobada' ? 'aprobados' : 'rechazados'}.</div>`);
    content.innerHTML = `<div class="scroll-x"><table class="tbl"><thead><tr><th></th><th>Título</th><th>Tipo</th><th>Categoría</th><th>Propuesto por</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-id="${p.id}"><td>${KF.poster(p, 'thumb')}</td>
        <td><a href="pelicula.html?id=${p.id}"><b>${KF.esc(p.titulo)}</b></a><br><small style="color:var(--muted)">${p.anio}</small></td>
        <td>${KF.esc(KF.TIPOS[p.tipo])}</td><td>${KF.esc(p.categoria_nombre)}</td><td>${KF.esc(p.creador_nombre)}</td>
        <td><span class="tag ${p.estado}">${p.estado}</span></td>
        <td><div class="acts">
          ${p.estado !== 'aprobada' ? '<button class="btn sm" data-a="aprobada">Aprobar</button>' : ''}
          ${p.estado !== 'rechazada' ? '<button class="btn sm ghost" data-a="rechazada">Rechazar</button>' : ''}
          <button class="btn sm ghost" data-a="edit">Editar</button><button class="btn sm danger" data-a="del">Eliminar</button></div></td></tr>`).join('')}
      </tbody></table></div>`;
    content.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => {
      const p = list.find((x) => x.id == b.closest('tr').dataset.id), a = b.dataset.a;
      if (a === 'edit') return KF.movieForm(p, load);
      if (a === 'del') return KF.confirm(`¿Eliminar "${p.titulo}" y todas sus reseñas?`, async () => { const r = await KF.api(`/peliculas/${p.id}`, { method: 'DELETE' }); KF.toast(r.message); load(); });
      act(() => KF.api(`/peliculas/${p.id}/estado`, { method: 'PATCH', body: { estado: a } }))();
    }));
  };

  const catForm = (c) => KF.modal(c ? 'Editar categoría' : 'Nueva categoría',
    `<div class="field"><label>Nombre</label><input name="nombre" maxlength="50" value="${KF.esc(c?.nombre)}"></div>
     <div class="field"><label>Descripción (opcional)</label><input name="descripcion" maxlength="255" value="${KF.esc(c?.descripcion)}"></div>`,
    async (v, d) => { if (!v.descripcion) delete v.descripcion;
      const r = await KF.api(c ? `/categorias/${c.id}` : '/categorias', { method: c ? 'PUT' : 'POST', body: v });
      d.close(); KF.toast(r.message); load(); });

  const loadCats = async () => {
    const { data } = await KF.api('/categorias'), list = data.categorias;
    content.innerHTML = `<div style="margin-bottom:14px"><button class="btn" id="newCat">+ Nueva categoría</button></div>
      ${list.length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>
      ${list.map((c) => `<tr data-id="${c.id}"><td><b>${KF.esc(c.nombre)}</b></td><td>${KF.esc(c.descripcion || '—')}</td>
        <td><div class="acts"><button class="btn sm ghost" data-a="edit">Editar</button><button class="btn sm danger" data-a="del">Eliminar</button></div></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Aún no hay categorías.</div>'}`;
    document.getElementById('newCat').onclick = () => catForm();
    content.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => {
      const c = list.find((x) => x.id == b.closest('tr').dataset.id);
      if (b.dataset.a === 'edit') return catForm(c);
      KF.confirm(`¿Eliminar la categoría "${c.nombre}"?`, async () => { const r = await KF.api(`/categorias/${c.id}`, { method: 'DELETE' }); KF.toast(r.message); load(); })
        .catch?.(() => {});
    }));
  };

  const load = async () => {
    content.innerHTML = '<div class="spin">Cargando…</div>';
    try { await (tab === 'categorias' ? loadCats() : loadMovies()); }
    catch (e) { content.innerHTML = KF.errHtml(e); }
  };
  load();
}
