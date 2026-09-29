/* login.js — TicketFlow
   Maneja el formulario de inicio de sesion.
   Endpoint: POST /auth/login
*/

(function () {
  "use strict";

  // Si ya hay sesion activa, ir directo a tickets
  if (localStorage.getItem("token")) {
    window.location.replace("tickets.html");
    return;
  }

  const form      = document.getElementById("form-login");
  const btnSubmit = document.getElementById("btn-submit");
  const msgError  = document.getElementById("msg-error");
  const msgInfo   = document.getElementById("msg-info");

  /** Muestra o limpia un mensaje de UI */
  function mostrarMensaje(el, texto, visible) {
    el.textContent = texto;
    el.classList.toggle("visible", visible);
  }

  /** Limpia todos los mensajes visibles */
  function limpiarMensajes() {
    mostrarMensaje(msgError, "", false);
    mostrarMensaje(msgInfo,  "", false);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    limpiarMensajes();

    const correo = document.getElementById("correo").value.trim();
    const clave  = document.getElementById("clave").value;

    // Validacion minima en cliente
    if (!correo || !clave) {
      mostrarMensaje(msgError, "Por favor completa todos los campos.", true);
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Entrando...";
    mostrarMensaje(msgInfo, "Verificando credenciales...", true);

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, clave }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensaje = data.mensaje || data.error || data.message ||
          "Correo o contraseña incorrectos.";
        mostrarMensaje(msgInfo,  "", false);
        mostrarMensaje(msgError, mensaje, true);
        return;
      }

      // Guardar token en localStorage
      if (!data.token) {
        mostrarMensaje(msgInfo,  "", false);
        mostrarMensaje(msgError, "El servidor no devolvió un token.", true);
        return;
      }

      localStorage.setItem("token", data.token);

      // Intentar guardar el rol si el backend lo devuelve
      // (puede venir en data.rol, data.usuario.rol, o decodificado del JWT)
      const rol = extraerRol(data);
      if (rol) localStorage.setItem("rol", rol);

      // Guardar nombre si el backend lo devuelve
      const nombre = data.nombre || (data.usuario && data.usuario.nombre) || "";
      if (nombre) localStorage.setItem("nombre", nombre);

      mostrarMensaje(msgInfo, "Sesión iniciada. Redirigiendo...", true);
      window.location.replace("tickets.html");

    } catch (err) {
      mostrarMensaje(msgInfo,  "", false);
      mostrarMensaje(msgError, "No se pudo conectar con el servidor.", true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Entrar";
    }
  });

  /**
   * Intenta extraer el rol del usuario de la respuesta del backend.
   * El backend puede devolverlo de varias formas — cubrir los casos comunes.
   * Si el backend incluye el rol en el payload del JWT, tambien lo decodificamos.
   */
  function extraerRol(data) {
    // Caso 1: el backend devuelve { rol: "agente" } directamente
    if (data.rol) return data.rol;

    // Caso 2: { usuario: { rol: "agente" } }
    if (data.usuario && data.usuario.rol) return data.usuario.rol;

    // Caso 3: decodificar el JWT (sin verificar firma — solo lectura del payload)
    if (data.token) {
      try {
        const partes   = data.token.split(".");
        const payload  = JSON.parse(atob(partes[1]));
        return payload.rol || payload.role || null;
      } catch (_) {
        return null;
      }
    }

    return null;
  }
})();
