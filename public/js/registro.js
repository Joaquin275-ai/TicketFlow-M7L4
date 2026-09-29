/* registro.js — TicketFlow
   Maneja el formulario de creacion de cuenta.
   Endpoint: POST /auth/registro
*/

(function () {
  "use strict";

  const form       = document.getElementById("form-registro");
  const btnSubmit  = document.getElementById("btn-submit");
  const msgError   = document.getElementById("msg-error");
  const msgSuccess = document.getElementById("msg-success");

  /** Muestra o limpia un mensaje de UI */
  function mostrarMensaje(el, texto, visible) {
    el.textContent = texto;
    el.classList.toggle("visible", visible);
  }

  /** Limpia todos los mensajes */
  function limpiarMensajes() {
    mostrarMensaje(msgError,   "", false);
    mostrarMensaje(msgSuccess, "", false);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    limpiarMensajes();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const clave  = document.getElementById("clave").value;

    // Validacion minima en cliente
    if (!nombre || !correo || !clave) {
      mostrarMensaje(msgError, "Por favor completa todos los campos.", true);
      return;
    }

    if (clave.length < 6) {
      mostrarMensaje(
        msgError,
        "La contraseña debe tener al menos 6 caracteres.",
        true
      );
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Creando cuenta...";

    try {
      const res = await fetch("/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, clave }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensaje = data.mensaje || data.error || data.message ||
          "No se pudo crear la cuenta. Intenta de nuevo.";
        mostrarMensaje(msgError, mensaje, true);
        return;
      }

      // Exito: mostrar mensaje y redirigir al login despues de un momento
      mostrarMensaje(
        msgSuccess,
        "Cuenta creada correctamente. Redirigiendo al inicio de sesión...",
        true
      );
      form.reset();

      setTimeout(function () {
        window.location.replace("login.html");
      }, 2000);

    } catch (err) {
      mostrarMensaje(
        msgError,
        "No se pudo conectar con el servidor.",
        true
      );
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Crear cuenta";
    }
  });
})();
