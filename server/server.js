const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');

// Importer les utilitaires
const { auditMiddleware, initAuditTable, logAudit, ACTION_TYPES } = require('./utils/audit');
const { initEncryptionTable } = require('./utils/encryption');

// Importer les routes
const authRoutes = require('./routes/auth');
const foldersRoutes = require('./routes/folders');
const filesRoutes = require('./routes/files');
const previewRoutes = require('./routes/preview');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = 3001;

// Créer les dossiers nécessaires
const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(logsDir);

// Initialiser les tables additionnelles
initAuditTable();
initEncryptionTable();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Middleware d'audit
app.use(auditMiddleware);

// Servir les fichiers statiques (MAIS PAS les PDF directement)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.path);
  const ext = path.extname(filePath).toLowerCase();
  
  // Bloquer l'accès direct aux PDF
  if (ext === '.pdf') {
    logAudit({
      actionType: ACTION_TYPES.SYSTEM_WARNING,
      actionDescription: 'Tentative d\'accès direct à un PDF bloquée',
      resourceName: path.basename(filePath),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: false,
      req
    });

    return res.status(403).json({
      success: false,
      error: 'Accès direct aux PDF non autorisé. Utilisez la prévisualisation.'
    });
  }
  
  // Autoriser les autres fichiers
  next();
}, express.static(uploadsDir));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/audit', auditRoutes);

// Route principale - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Route pour toutes les autres URLs (SPA)
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Logger l'erreur
  logAudit({
    userId: req.session?.adminId,
    userEmail: req.session?.adminEmail,
    actionType: ACTION_TYPES.SYSTEM_ERROR,
    actionDescription: 'Erreur serveur',
    errorMessage: err.message,
    success: false,
    req
  });

  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne',
    details: err.message
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📁 Dossier uploads: ${uploadsDir}`);
  console.log(`📝 Dossier logs: ${logsDir}`);
});

// Gérer l'arrêt propre du serveur
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});
