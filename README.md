# 🎫 TicketFlow — Mesa de Ayuda de Bytenova

**Home Challenge — Cierre de Módulo 2**

---

## 🌌 Premisa

Bytenova necesita un sistema de tickets de soporte interno. Cada empleado puede crear tickets y ver solo los suyos. El equipo de soporte (rol `agente`) necesita ver y atender TODOS los tickets de la empresa.

El frontend ya está armado y lo tienes en `public/`. Tu misión es 100% backend — nadie te va a dar ningún ticket resuelto esta vez.

---

## 📜 El Contrato (Requisitos Obligatorios)

- **Ticket 1 — Auth completo.** Registro y login con `bcrypt` + `jsonwebtoken`. Todo usuario nuevo empieza con rol `usuario`.
- **Ticket 2 — CRUD de tickets.** Crear un ticket (con `usuario_id` sacado del token, nunca del body) y listar SOLO los tickets del usuario autenticado.
- **Ticket 3 — Candado en escritura.** Editar el estado de un ticket propio (`abierto` → `en_proceso` → `cerrado`) usando el patrón traer → comparar → actuar.
- **Ticket 4 — Ruta de agente.** `GET /tickets/todos` — solo accesible si `rol === 'agente'`, devuelve los tickets de TODA la empresa, sin filtrar por dueño. Un agente también puede cambiar el estado de cualquier ticket, no solo los suyos.

**No se aceptan entregas incompletas.** El frontend ya viene dado y conectado a estos endpoints — si quieres modificarlo, corre por tu cuenta y no es parte del contrato.

---

## 🗄️ Base de datos (SQL para Supabase)

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT UNIQUE NOT NULL,
  clave TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario'
);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_proceso', 'cerrado')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Cómo correr el proyecto

```bash
pnpm install
cp .env.example .env
```

Completa tu `.env` con tus credenciales de Supabase y tu propio `JWT_SECRET`.

```bash
pnpm dev
```

---

## 🔥 Bonus — El Detector de Urgencia (opcional, para los que les sobre tiempo)

Ahora mismo, todo ticket nuevo nace con prioridad `media` por default. Tu bonus: antes de guardar el ticket, revisa el texto de la `descripcion` — si contiene palabras como `"urgente"`, `"no funciona"` o `"crítico"` (usa `.includes()`, ya lo conoces), asigna automáticamente `prioridad: 'alta'` en vez de dejar que el usuario la elija a mano.

No es obligatorio, no bloquea tu entrega, y no necesitas ningún método que no hayas visto — es puro `if`/`.includes()` aplicado con un poco de creatividad. Si alguien escribe "el servidor está en llamas, esto es urgente" y ve su ticket marcarse solo como 🔴 Alta, esa es la señal de que lo lograste.
