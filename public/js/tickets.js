/* tickets.js — TicketFlow
   Pantalla principal: crear tickets, listarlos y actualizar su estado.
   Endpoints usados:
     GET  /tickets          — mis tickets
     POST /tickets          — crear ticket
     PUT  /tickets/:id      — actualizar estado
     GET  /tickets/todos    — todos los tickets (solo agente)
*/

(function () {
  "use strict";

  /* --------------------------------------------------------
     Constantes y estado global
  -------------------------------------------------------- */

  const TOKEN     = localStorage.getItem("token");
  const ROL       = localStorage.getItem("rol") || "usuario";
  const NOMBRE_US = localStorage.getItem("nombre") || "";

  // Si no hay token, redirigir al login
  if (!TOKEN) {
    window.location.replace("login.html");
    return;
  }

  /* --------------------------------------------------------
     Referencias al DOM
  -------------------------------------------------------- */

  const topbarUser        = document.getElementById("topbar-user");
  const btnLogout         = document.getElementById("btn-logout");
  const accionesAgente    = document.getElementById("acciones-agente");

  const formTicket        = document.getElementById("form-ticket");
  const btnCrear          = document.getElementById("btn-crear");
  const msgCrearError     = document.getElementById("msg-crear-error");
  const msgCrearSuccess   = document.getElementById("msg-crear-success");

  const listaTickets      = document.getElementById("lista-tickets");
  const tituloLista       = document.getElementById("titulo-lista");
  const msgListaError     = document.getElementById("msg-lista-error");
  const msgListaInfo      = document.getElementById("msg-lista-info");

  /* --------------------------------------------------------
     Inicializacion
  -------------------------------------------------------- */

  // Mostrar nombre de usuario en la topbar
  topbarUser.textContent = NOMBRE_US
    ? `Hola, ${NOMBRE_US}`
    : "";

  // Insertar boton "Ver todos los tickets" SOLO si el rol es agente
  if (ROL === "agente") {
    const btn = document.createElement("button");
    btn.id        = "btn-ver-todos";
    btn.type      = "button";
    btn.className = "btn btn-secondary btn-sm";
    btn.textContent = "Ver todos los tickets";
    btn.addEventListener("click", cargarTodosLosTickets);
    accionesAgente.appendChild(btn);
  }

  // Cargar mis tickets al iniciar
  cargarMisTickets();

  /* --------------------------------------------------------
     Cierre de sesion
  -------------------------------------------------------- */

  btnLogout.addEventListener("click", function () {
    localStorage.clear();
    window.location.replace("login.html");
  });

  /* --------------------------------------------------------
     Helpers de UI
  -------------------------------------------------------- */

  function mostrarMensaje(el, texto, visible) {
    el.textContent = texto;
    el.classList.toggle("visible", visible);
  }

  function limpiarMensajesLista() {
    mostrarMensaje(msgListaError, "", false);
    mostrarMensaje(msgListaInfo,  "", false);
  }

  function limpiarMensajesCrear() {
    mostrarMensaje(msgCrearError,   "", false);
    mostrarMensaje(msgCrearSuccess, "", false);
  }

  /* --------------------------------------------------------
     Fetch con autenticacion
     Redirige a login si el servidor devuelve 401.
  -------------------------------------------------------- */

  async function apiFetch(url, opciones) {
    const headers = Object.assign(
      { "Content-Type": "application/json", "Authorization": "Bearer " + TOKEN },
      (opciones && opciones.headers) || {}
    );

    const res = await fetch(url, Object.assign({}, opciones, { headers }));

    if (res.status === 401) {
      localStorage.clear();
      window.location.replace("login.html");
      throw new Error("sesion-expirada");
    }

    return res;
  }

  /* --------------------------------------------------------
     Formatear fecha legible
  -------------------------------------------------------- */

  function formatearFecha(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString("es", {
      day:    "2-digit",
      month:  "2-digit",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });
  }

  /* --------------------------------------------------------
     Construir clase CSS del badge segun valor
  -------------------------------------------------------- */

  function claseBadgeEstado(estado) {
    const mapa = {
      abierto:    "badge--abierto",
      en_proceso: "badge--en_proceso",
      cerrado:    "badge--cerrado",
    };
    return "badge " + (mapa[estado] || "badge--cerrado");
  }

  function claseBadgePrioridad(prioridad) {
    const mapa = {
      baja:  "badge--baja",
      media: "badge--media",
      alta:  "badge--alta",
    };
    return "badge " + (mapa[prioridad] || "badge--media");
  }

  /* --------------------------------------------------------
     Etiqueta legible para el estado
  -------------------------------------------------------- */

  function textoEstado(estado) {
    const mapa = {
      abierto:    "Abierto",
      en_proceso: "En proceso",
      cerrado:    "Cerrado",
    };
    return mapa[estado] || estado;
  }

  /* --------------------------------------------------------
     Renderizar una tarjeta de ticket
     mostrarOwner: boolean — si se debe mostrar el nombre del usuario
  -------------------------------------------------------- */

  function crearTarjetaTicket(ticket, mostrarOwner) {
    const card = document.createElement("article");
    card.className  = "ticket-card";
    card.dataset.id = ticket.id;

    // Nombre del dueno (solo en vista de agente)
    const ownerHTML = mostrarOwner
      ? `<p class="ticket-card__owner">
           Usuario: <strong>${escapar(ticket.nombre_usuario || ticket.usuario_nombre || "—")}</strong>
         </p>`
      : "";

    card.innerHTML = `
      <div class="ticket-card__body">
        <div class="ticket-card__meta">
          <span class="${claseBadgeEstado(ticket.estado)}"
                aria-label="Estado: ${textoEstado(ticket.estado)}">
            ${textoEstado(ticket.estado)}
          </span>
          <span class="${claseBadgePrioridad(ticket.prioridad)}"
                aria-label="Prioridad: ${ticket.prioridad}">
            ${ticket.prioridad}
          </span>
        </div>
        <p class="ticket-card__title">${escapar(ticket.titulo)}</p>
        <p class="ticket-card__desc">${escapar(ticket.descripcion)}</p>
        ${ownerHTML}
      </div>
      <div class="ticket-card__actions">
        <span class="ticket-card__date">${formatearFecha(ticket.creado_en)}</span>
        <select
          class="ticket-card__select"
          aria-label="Cambiar estado del ticket"
          data-ticket-id="${ticket.id}"
        >
          <option value="abierto"    ${ticket.estado === "abierto"    ? "selected" : ""}>Abierto</option>
          <option value="en_proceso" ${ticket.estado === "en_proceso" ? "selected" : ""}>En proceso</option>
          <option value="cerrado"    ${ticket.estado === "cerrado"    ? "selected" : ""}>Cerrado</option>
        </select>
        <span
          class="msg msg--error"
          id="msg-estado-${ticket.id}"
          role="alert"
          style="display:none; margin:0;"
        ></span>
      </div>
    `;

    // Listener del select para actualizar estado
    const select = card.querySelector(".ticket-card__select");
    select.addEventListener("change", function () {
      actualizarEstado(ticket.id, select.value, select, card);
    });

    return card;
  }

  /* --------------------------------------------------------
     Renderizar lista de tickets
     tickets: array de tickets
     mostrarOwner: boolean
  -------------------------------------------------------- */

  function renderizarLista(tickets, mostrarOwner) {
    listaTickets.innerHTML = "";

    if (!tickets || tickets.length === 0) {
      listaTickets.innerHTML = `
        <div class="empty-state">
          <p>Sin tickets por el momento</p>
          <p>Cuando crees un ticket, aparecerá aquí.</p>
        </div>
      `;
      return;
    }

    const contenedor = document.createElement("div");
    contenedor.className = "tickets-list";
    tickets.forEach(function (t) {
      contenedor.appendChild(crearTarjetaTicket(t, mostrarOwner));
    });
    listaTickets.appendChild(contenedor);
  }

  /* --------------------------------------------------------
     Renderizar lista agrupada por usuario (vista agente)
  -------------------------------------------------------- */

  function renderizarListaAgrupada(tickets) {
    listaTickets.innerHTML = "";

    if (!tickets || tickets.length === 0) {
      listaTickets.innerHTML = `
        <div class="empty-state">
          <p>No hay tickets en el sistema</p>
          <p>Los tickets de todos los usuarios aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    // Agrupar por nombre de usuario
    const grupos = {};
    tickets.forEach(function (t) {
      const key = t.nombre_usuario || t.usuario_nombre || "Sin usuario";
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(t);
    });

    const wrapper = document.createElement("div");

    Object.keys(grupos).forEach(function (usuario) {
      const encabezado = document.createElement("p");
      encabezado.className = "group-header";
      encabezado.textContent = usuario;
      wrapper.appendChild(encabezado);

      const lista = document.createElement("div");
      lista.className = "tickets-list";
      grupos[usuario].forEach(function (t) {
        lista.appendChild(crearTarjetaTicket(t, false)); // ya vemos el grupo
      });
      wrapper.appendChild(lista);
    });

    listaTickets.appendChild(wrapper);
  }

  /* --------------------------------------------------------
     GET /tickets — mis tickets
  -------------------------------------------------------- */

  async function cargarMisTickets() {
    limpiarMensajesLista();
    tituloLista.textContent = "Mis tickets";
    listaTickets.innerHTML  = `<p class="msg msg--info visible">Cargando tickets...</p>`;

    try {
      const res  = await apiFetch("/tickets");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.mensaje || data.error || data.message || "Error al cargar tickets.";
        mostrarMensaje(msgListaError, msg, true);
        listaTickets.innerHTML = "";
        return;
      }

      const tickets = Array.isArray(data) ? data : (data.tickets || []);
      renderizarLista(tickets, false);

    } catch (err) {
      if (err.message === "sesion-expirada") return;
      mostrarMensaje(msgListaError, "No se pudo conectar con el servidor.", true);
      listaTickets.innerHTML = "";
    }
  }

  /* --------------------------------------------------------
     GET /tickets/todos — todos los tickets (solo agente)
  -------------------------------------------------------- */

  async function cargarTodosLosTickets() {
    limpiarMensajesLista();
    tituloLista.textContent = "Todos los tickets";
    listaTickets.innerHTML  = `<p class="msg msg--info visible">Cargando todos los tickets...</p>`;

    // Redibujar el boton para mostrar opcion de volver
    const btn = document.getElementById("btn-ver-todos");
    if (btn) {
      btn.textContent = "Ver mis tickets";
      btn.removeEventListener("click", cargarTodosLosTickets);
      btn.addEventListener("click", function volverAMios() {
        btn.textContent = "Ver todos los tickets";
        btn.removeEventListener("click", volverAMios);
        btn.addEventListener("click", cargarTodosLosTickets);
        cargarMisTickets();
      });
    }

    try {
      const res  = await apiFetch("/tickets/todos");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.mensaje || data.error || data.message || "Error al cargar tickets.";
        mostrarMensaje(msgListaError, msg, true);
        listaTickets.innerHTML = "";
        return;
      }

      const tickets = Array.isArray(data) ? data : (data.tickets || []);
      renderizarListaAgrupada(tickets);

    } catch (err) {
      if (err.message === "sesion-expirada") return;
      mostrarMensaje(msgListaError, "No se pudo conectar con el servidor.", true);
      listaTickets.innerHTML = "";
    }
  }

  /* --------------------------------------------------------
     POST /tickets — crear ticket
  -------------------------------------------------------- */

  formTicket.addEventListener("submit", async function (e) {
    e.preventDefault();
    limpiarMensajesCrear();

    const titulo      = document.getElementById("ticket-titulo").value.trim();
    const descripcion = document.getElementById("ticket-descripcion").value.trim();
    const prioridad   = document.getElementById("ticket-prioridad").value;

    if (!titulo || !descripcion) {
      mostrarMensaje(msgCrearError, "El título y la descripción son obligatorios.", true);
      return;
    }

    btnCrear.disabled     = true;
    btnCrear.textContent  = "Enviando...";

    try {
      const res  = await apiFetch("/tickets", {
        method: "POST",
        body: JSON.stringify({ titulo, descripcion, prioridad }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.mensaje || data.error || data.message || "Error al crear el ticket.";
        mostrarMensaje(msgCrearError, msg, true);
        return;
      }

      mostrarMensaje(msgCrearSuccess, "Ticket creado correctamente.", true);
      formTicket.reset();

      // Recargar la lista de mis tickets
      await cargarMisTickets();

    } catch (err) {
      if (err.message === "sesion-expirada") return;
      mostrarMensaje(msgCrearError, "No se pudo conectar con el servidor.", true);
    } finally {
      btnCrear.disabled    = false;
      btnCrear.textContent = "Enviar ticket";
    }
  });

  /* --------------------------------------------------------
     PUT /tickets/:id — actualizar estado de un ticket
  -------------------------------------------------------- */

  async function actualizarEstado(id, nuevoEstado, selectEl, cardEl) {
    // Deshabilitar el select mientras se procesa
    selectEl.disabled = true;

    const msgEl = cardEl.querySelector("#msg-estado-" + id);
    if (msgEl) { msgEl.textContent = ""; msgEl.style.display = "none"; }

    try {
      const res  = await apiFetch("/tickets/" + id, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.mensaje || data.error || data.message || "Error al actualizar el estado.";
        if (msgEl) {
          msgEl.textContent = msg;
          msgEl.style.display = "block";
        }
        return;
      }

      // Actualizar el badge de estado en la tarjeta sin recargar toda la lista
      const badge = cardEl.querySelector(".badge:first-child");
      if (badge) {
        badge.className   = claseBadgeEstado(nuevoEstado);
        badge.textContent = textoEstado(nuevoEstado);
        badge.setAttribute("aria-label", "Estado: " + textoEstado(nuevoEstado));
      }

    } catch (err) {
      if (err.message === "sesion-expirada") return;
      if (msgEl) {
        msgEl.textContent   = "Error de conexión.";
        msgEl.style.display = "block";
      }
    } finally {
      selectEl.disabled = false;
    }
  }

  /* --------------------------------------------------------
     Escaper HTML para prevenir XSS basico
  -------------------------------------------------------- */

  function escapar(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#39;");
  }
})();
