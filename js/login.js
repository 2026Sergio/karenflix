KF.mount();
if (KF.token()) location.replace('index.html');
let mode = 'login';
const form = document.getElementById('authForm'), msg = document.getElementById('msg');
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  mode = b.dataset.m; msg.innerHTML = '';
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  document.getElementById('fNombre').classList.toggle('hidden', mode === 'login');
  document.getElementById('submit').textContent = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
  document.getElementById('contrasena').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
}));
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  if (mode === 'login') delete v.nombre;
  try {
    const { data } = await KF.api(`/auth/${mode}`, { method: 'POST', body: v });
    KF.setSession(data.usuario, data.token);
    location.href = KF.qs('next') || (data.usuario.rol === 'administrador' ? 'admin.html' : 'index.html');
  } catch (er) { msg.innerHTML = KF.errHtml(er); }
});
