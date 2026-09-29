import supabase from '../config/supabaseClient.js'

const crearTicket = async (req, res) => {
  try {
    const {
      titulo,
      descripcion
    } = req.body

    if (!titulo || !descripcion) {
      return res.status(400).json({
        error: 'Faltan datos'
      })
    }

    let prioridad = 'media'

    const texto = descripcion.toLowerCase()

    if (
      texto.includes('urgente') ||
      texto.includes('no funciona') ||
      texto.includes('crítico')
    ) {
      prioridad = 'alta'
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        usuario_id: req.usuario.id,
        titulo,
        descripcion,
        prioridad
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({
        error: error.message
      })
    }

    res.status(201).json({
      data
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

const obtenerMisTickets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('usuario_id', req.usuario.id)

    if (error) {
      return res.status(400).json({
        error: error.message
      })
    }

    res.json({
      data
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const estadosValidos = [
      'abierto',
      'en_proceso',
      'cerrado'
    ]

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido'
      })
    }

    const { data: ticket, error: errorBusqueda } =
      await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (errorBusqueda || !ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      })
    }

    if (
      req.usuario.rol !== 'agente' &&
      ticket.usuario_id !== req.usuario.id
    ) {
      return res.status(403).json({
        error: 'No puedes modificar este ticket'
      })
    }

    if (ticket.estado === 'abierto' && estado !== 'en_proceso') {
      return res.status(400).json({
        error: 'Un ticket abierto solo puede pasar a en_proceso'
      })
    }

    if (ticket.estado === 'en_proceso' && estado !== 'cerrado') {
      return res.status(400).json({
        error: 'Un ticket en_proceso solo puede pasar a cerrado'
      })
    }

    if (ticket.estado === 'cerrado') {
      return res.status(400).json({
        error: 'El ticket ya está cerrado'
      })
    }

    const { data, error } = await supabase
      .from('tickets')
      .update({
        estado
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({
        error: error.message
      })
    }

    res.json({
      data
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
const obtenerTodosLosTickets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')

    if (error) {
      return res.status(400).json({
        error: error.message
      })
    }

    res.json({
      data
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
export {
  crearTicket,
  obtenerMisTickets,
  cambiarEstado,
  obtenerTodosLosTickets
}