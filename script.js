document.addEventListener('DOMContentLoaded', () => {
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const loginForm = document.getElementById('login-form');
  const messageElement = document.getElementById('message');
  const loginPanel = document.querySelector('.login-panel');
  const emailInput = document.getElementById('email');

  // Alternar visibilidad de la contraseña
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
  }

  // Manejo del formulario y validación de credenciales
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      messageElement.textContent = '';
      messageElement.className = 'message';

      const usuario = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!usuario || !password) {
        triggerError('¡Ups! Por favor llena todos los campos.');
        return;
      }

      // Validamos el usuario y contraseña exactos que pediste
      if (usuario === 'SHOTY007' && password === 'PERLA007') {
        messageElement.textContent = '¡Bienvenido administrador! ✨';
        messageElement.classList.add('success');

        setTimeout(() => {
          // Redirige al archivo del panel administrativo ubicado en la raíz
         window.location.href = 'admin.html';
        }, 1000);
      } else {
        triggerError('Usuario o contraseña incorrectos.');
      }
    });
  }

  function triggerError(msg) {
    messageElement.textContent = msg;
    messageElement.classList.add('error');
    if (loginPanel) loginPanel.classList.add('shake');

    setTimeout(() => {
      if (loginPanel) loginPanel.classList.remove('shake');
    }, 400);
  }
});