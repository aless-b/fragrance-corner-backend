const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'perfume-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

const DB_NAME = process.env.DB_NAME || 'fragrance_corner_db';

let pool = null;
let isConnected = false;

// Datos de semilla iniciales
let inMemoryPerfumes = [
  {
    id: "perfume-1",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    category: "Oriental",
    price: 325,
    volume: 70,
    gender: "Unisex",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    id: "perfume-2",
    name: "Bleu de Chanel",
    brand: "Chanel",
    category: "Woody",
    price: 185,
    volume: 100,
    gender: "Masculino",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    id: "perfume-3",
    name: "Black Opium",
    brand: "Yves Saint Laurent",
    category: "Gourmand",
    price: 155,
    volume: 90,
    gender: "Femenino",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    id: "perfume-4",
    name: "Oud Wood",
    brand: "Tom Ford",
    category: "Woody",
    price: 295,
    volume: 50,
    gender: "Unisex",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    id: "perfume-5",
    name: "J'adore",
    brand: "Dior",
    category: "Floral",
    price: 170,
    volume: 100,
    gender: "Femenino",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    id: "perfume-6",
    name: "Aqua Allegoria Mandarine Basilic",
    brand: "Guerlain",
    category: "Fresh",
    price: 140,
    volume: 125,
    gender: "Unisex",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  }
];

async function initDB(retries = 5, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Conectando a MySQL en ${dbConfig.host}:${dbConfig.port} (Intento ${attempt}/${retries})...`);

      // 1. Crear conexión root para verificar la existencia de la BD
      const connection = await mysql.createConnection(dbConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      await connection.end();

      // 2. Crear Pool conectado a la BD específica
      pool = mysql.createPool({
        ...dbConfig,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // 3. Crear Tabla de perfumes si no existe (usando LONGTEXT para soportar imágenes en Base64)
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS perfumes (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT 'Oriental',
          gender VARCHAR(50) DEFAULT 'Unisex',
          price DECIMAL(10, 2) NOT NULL,
          volume INT DEFAULT 100,
          rating DECIMAL(3, 1) DEFAULT 4.8,
          image LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await pool.query(createTableQuery);

      // Asegurar que la columna 'image' sea LONGTEXT en tablas existentes
      try {
        await pool.query('ALTER TABLE perfumes MODIFY COLUMN image LONGTEXT;');
      } catch (e) {
        // Ignorar si ya era LONGTEXT o no aplica
      }

      // 4. Asegurar que las semillas iniciales existan en MySQL
      for (const p of inMemoryPerfumes) {
        await pool.query(
          `INSERT IGNORE INTO perfumes (id, name, brand, category, gender, price, volume, rating, image) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.brand, p.category, p.gender, p.price, p.volume, p.rating, p.image]
        );
      }
      console.log('✅ Base de Datos MySQL conectada y verificada exitosamente.');

      isConnected = true;
      return;
    } catch (err) {
      console.warn(`⚠️ Intento ${attempt} fallido al conectar a MySQL: ${err.message}`);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  console.warn('⚠️ Se agotaron los reintentos para MySQL. Usando modo en memoria de respaldo.');
  isConnected = false;
}

// Métodos de acceso a datos
async function getAllPerfumes() {
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM perfumes ORDER BY created_at DESC');
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        category: r.category,
        gender: r.gender,
        price: parseFloat(r.price),
        volume: parseInt(r.volume, 10),
        rating: parseFloat(r.rating),
        image: r.image,
        createdAt: r.created_at
      }));
    } catch (e) {
      console.error('Error al consultar MySQL:', e);
    }
  }
  return inMemoryPerfumes;
}

async function addPerfume(item) {
  const newPerfume = {
    id: `perfume-${Date.now()}`,
    name: item.name,
    brand: item.brand,
    category: item.category || 'Oriental',
    gender: item.gender || 'Unisex',
    price: parseFloat(item.price) || 0,
    volume: parseInt(item.volume, 10) || 100,
    rating: item.rating ? parseFloat(item.rating) : 4.8,
    image: item.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO perfumes (id, name, brand, category, gender, price, volume, rating, image) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newPerfume.id, newPerfume.name, newPerfume.brand, newPerfume.category, newPerfume.gender, newPerfume.price, newPerfume.volume, newPerfume.rating, newPerfume.image]
      );
      console.log('✅ Perfume insertado correctamente en la tabla MySQL:', newPerfume.name);
    } catch (e) {
      console.error('❌ Error al insertar en MySQL:', e);
    }
  }

  inMemoryPerfumes.unshift(newPerfume);
  return newPerfume;
}

async function deletePerfume(id) {
  if (isConnected && pool) {
    try {
      await pool.query('DELETE FROM perfumes WHERE id = ?', [id]);
    } catch (e) {
      console.error('Error al eliminar en MySQL:', e);
    }
  }
  inMemoryPerfumes = inMemoryPerfumes.filter(p => p.id !== id);
  return true;
}

module.exports = {
  initDB,
  getAllPerfumes,
  addPerfume,
  deletePerfume
};
