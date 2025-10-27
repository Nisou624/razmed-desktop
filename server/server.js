const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');

// Importer les routes uniquement (pas les utils pour éviter les erreurs)
const authRoutes = require('./routes/auth');
const foldersRoutes = require('./routes/folders');
const filesRoutes = require('./routes/files');
const previewRoutes = require('./routes/preview');

const app = express();
const PORT = process.env.PORT || 3001;

// Créer les dossiers nécessaires
const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(logsDir);

console.log('📁 Dossier uploads:', uploadsDir);
console.log('📝 Dossier logs:', logsDir);

// Middleware CORS plus permissif
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configuration de la session
app.use(session({
  secret: 'sntp-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Route de sanité AVANT les autres routes
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check demandé');
  res.json({
    success: true,
    message: 'Serveur en fonctionnement',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/preview', previewRoutes);

// Route racine - servir index.html
app.get('/', (req, res) => {
  console.log('📄 Demande page principale');
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      success: true,
      message: 'SNTP Document Portal - Serveur actif',
      port: PORT
    });
  }
});

// Route catch-all pour SPA
app.get('*', (req, res) => {
  console.log('🔄 Route catch-all:', req.url);
  
  if (req.url.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Route API non trouvée'
    });
  }
  
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      success: true,
      message: 'SNTP Document Portal',
      availableRoutes: ['/api/health', '/api/auth', '/api/folders', '/api/files']
    });
  }
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne',
    message: err.message
  });
});

// Fonction pour démarrer le serveur avec retry
function startServer(port = PORT, retries = 5) {
  const server = app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
    
    // Écrire le port dans un fichier pour Electron
    const portFile = path.join(__dirname, '..', 'server-port.txt');
    fs.writeFileSync(portFile, port.toString());
    console.log(`📝 Port sauvegardé: ${port}`);
    
    // Test de la route health
    setTimeout(() => {
      const http = require('http');
      http.get(`http://localhost:${port}/api/health`, (res) => {
        console.log('✅ Route /api/health accessible');
      }).on('error', (err) => {
        console.log('❌ Erreur test health:', err.message);
      });
    }, 1000);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ Port ${port} occupé`);
      
      if (retries > 0) {
        console.log(`🔄 Tentative sur le port ${port + 1}...`);
        return startServer(port + 1, retries - 1);
      } else {
        console.error('❌ Impossible de trouver un port libre');
        process.exit(1);
      }
    } else {
      console.error('❌ Erreur serveur:', err);
      process.exit(1);
    }
  });

  return server;
}

// Gérer l'arrêt propre
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  console.log('\n🛑 Arrêt du serveur...');
  
  const portFile = path.join(__dirname, '..', 'server-port.txt');
  if (fs.existsSync(portFile)) {
    fs.unlinkSync(portFile);
    console.log('🗑️ Fichier de port supprimé');
  }
  
  process.exit(0);
}

// Démarrer le serveur
console.log('🚀 Démarrage du serveur...');
startServer();

