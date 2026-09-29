import express from 'express'
import {
  crearTicket,
  obtenerMisTickets,
  cambiarEstado,
  obtenerTodosLosTickets
} from '../controllers/tickets.controller.js'
import verificarToken from '../middlewares/verificarToken.js'
import verificarAgente from '../middlewares/verificarAgente.js'

const router = express.Router()

router.get(
  '/todos',
  verificarToken,
  verificarAgente,
  obtenerTodosLosTickets
)

router.post('/', verificarToken, crearTicket)

router.get('/', verificarToken, obtenerMisTickets)

router.patch('/:id/estado', verificarToken, cambiarEstado)

export default router