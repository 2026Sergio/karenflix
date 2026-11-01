KF.mount('lista');
const $ = (id) => document.getElementById(id);
const st = { categoria_id: KF.qs('categoria_id') || '', tipo: KF.qs('tipo') || '', orden: KF.qs('orden') || 'recientes', q: KF.qs('busqueda') || '' };
$('fTipo').value = st.tipo; $('fOrden').value = st.orden; $('fQ').value = st.q;

const load = async () => {
  const p = new URLSearchParams();
  if (st.categoria_id) p.set('categoria_id', st.categoria_id);
  if (st.tipo) p.set('tipo', st.tipo);
  if (st.orden) p.set('orden', st.orden);
  if (st.q) p.set('busqueda', st.q);
  history.replaceState(null, '', '?' + new URLSearchParams({ ...(st.categoria_id && { categoria_id: st.categoria_id }), ...(st.tipo && { tipo: st.tipo }), orden: st.orden, ...(st.q && { busqueda: st.q }) }));
  $('grid').innerHTML = '<div class="spin" style="grid-column:1/-1">Cargando…</div>';
  try {
    const { data } = await KF.api('/peliculas?' + p);
    const list = data.peliculas, ranked = st.orden !== 'recientes';
    $('count').textContent = `${list.length} título${list.length === 1 ? '' : 's'}`;
    $('title').textContent = st.orden === 'ranking' ? 'Ranking' : st.orden === 'popularidad' ? 'Más populares' : 'Explorar';
    $('grid').innerHTML = list.length ? list.map((m, n) => KF.card(m, ranked ? n + 1 : 0)).join('')
      : '<div class="empty" style="grid-column:1/-1">No encontramos títulos con esos filtros.</div>';
  } catch (e) { $('grid').innerHTML = `<div style="grid-column:1/-1">${KF.errHtml(e)}</div>`; }
};

(async () => {
  try {
    const { data } = await KF.api('/categorias');
    const draw = () => {
      $('chips').innerHTML = `<button class="chip ${!st.categoria_id ? 'on' : ''}" data-c="">Todas</button>` +
        data.categorias.map((c) => `<button class="chip ${st.categoria_id == c.id ? 'on' : ''}" data-c="${c.id}">${KF.esc(c.nombre)}</button>`).join('');
      $('chips').querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { st.categoria_id = b.dataset.c; draw(); load(); }));
    };
    draw();
  } catch { /* se muestra error en el listado */ }
})();
$('fTipo').onchange = (e) => { st.tipo = e.target.value; load(); };
$('fOrden').onchange = (e) => { st.orden = e.target.value; load(); };
let t; $('fQ').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); load(); }, 300); };
load();
