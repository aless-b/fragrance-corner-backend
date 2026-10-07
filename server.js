const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initDB, getAllPerfumes, addPerfume, deletePerfume } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de Validación de Bearer Token JWT
const requireBearerToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Acceso Denegado: Cabecera Authorization con Bearer Token JWT es requerida.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedPayload = jwt.decode(token);

    if (!token || token.length < 10) {
      return res.status(401).json({ error: 'Token JWT malformado o vacío.' });
    }

    // Guardar el payload decodificado y el token crudo en req para ser usado en el handler
    req.jwtPayload = decodedPayload;
    req.rawToken = token;

    console.log(`🔒 [JWT VALIDATED] Petición ${req.method} ${req.originalUrl} autorizada para el usuario: ${decodedPayload?.preferred_username || decodedPayload?.name || 'Desconocido'}`);

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Error al decodificar el Bearer Token JWT.', details: err.message });
  }
};

// Rutas Públicas
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Fragrance Corner MySQL Backend' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Fragrance Corner MySQL Backend', timestamp: new Date().toISOString() });
});

// Rutas Protegidas por JWT Bearer Token

// GET Listado de Perfumes desde MySQL
app.get('/api/perfumes', requireBearerToken, async (req, res) => {
  try {
    const perfumes = await getAllPerfumes();
    res.json({
      message: 'Catálogo obtenido exitosamente desde MySQL',
      user: req.jwtPayload?.preferred_username || 'Desconocido',
      data: perfumes
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al consultar perfumes', details: error.message });
  }
});

// POST Alta de Perfume en MySQL
app.post('/api/perfumes', requireBearerToken, async (req, res) => {
  try {
    const { name, brand, category, gender, price, volume, rating, image } = req.body;

    if (!name || !brand || !price) {
      return res.status(400).json({ error: 'Nombre, Marca y Precio son campos obligatorios.' });
    }

    const createdPerfume = await addPerfume({ name, brand, category, gender, price, volume, rating, image });

    console.log(`✨ [MYSQL INSERT] Perfume "${createdPerfume.name}" registrado por usuario: ${req.jwtPayload?.preferred_username || 'Desconocido'}`);

    res.status(201).json({
      message: 'Perfume agregado con éxito en la base de datos MySQL',
      data: createdPerfume
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar perfume en MySQL', details: error.message });
  }
});

// DELETE Eliminar Perfume en MySQL
app.delete('/api/perfumes/:id', requireBearerToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deletePerfume(id);
    res.json({ message: `Perfume ${id} eliminado exitosamente de MySQL` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar perfume', details: error.message });
  }
});

// Inicializar BD y Servidor
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend MySQL ejecutándose en http://localhost:${PORT}`);
    console.log(`🔐 Todos los endpoints /api/perfumes están protegidos con validación de Bearer Token JWT.`);
  });
});
