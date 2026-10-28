const formulario = document.getElementById('formulario');
const passInput = document.getElementById('password');
const checkVisible = document.getElementById('visible');

let usuarios = JSON.parse(localStorage.getItem('usuarios_sistema')) || [
    {
        nombre: "Juan",
        correo: "juan@gmail.com",
        pass: "juanito123"
    }
];

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    const encontrado = usuarios.find(u => u.correo === user && u.pass === pass);

    if (encontrado) {
        alert("¡Bienvenido " + encontrado.nombre + "!");
        localStorage.setItem('usuario_actual', JSON.stringify(encontrado));
        window.location.href = './home.html';
    } else {
        alert("Credenciales incorrectas.");
    }
});

checkVisible.addEventListener('change', function() {
    if (this.checked) {
        passInput.type = 'text';
    } else {
        passInput.type = 'password';
    }
 }); 