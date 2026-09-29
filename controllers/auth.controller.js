import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import supabase from '../config/supabaseClient.js'

const registrar = async (req, res) => {
  try {
    const { nombre, correo, clave } = req.body

    if (!nombre || !correo || !clave) {
      return res.status(400).json({
        error: 'Faltan datos'
      })
    }

    const claveHash = await bcrypt.hash(clave, 10)

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        correo,
        clave: claveHash,
        rol: 'usuario'
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

const iniciarSesion = async (req, res) => {
  try {
    const { correo, clave } = req.body

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single()

    if (error || !usuario) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      })
    }

    const claveValida = await bcrypt.compare(
      clave,
      usuario.clave
    )

    if (!claveValida) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      }
    )

    res.json({
      token
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

export {
  registrar,
  iniciarSesion
}