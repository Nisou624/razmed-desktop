const express = require('express');
const bcrypt = require('bcryptjs');
const { get } = require('../database');

const router = express.Router();

// Middleware pour vérifier si l'utilisateur est connecté
function isAuthenticated(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Non authentifié' });
  }
}

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    // Récupérer l'admin
    const admin = await get('SELECT * FROM admins WHERE email = ?', [email]);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Créer la session
    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la déconnexion'
      });
    }
    
    res.json({ success: true });
  });
});

// GET /api/auth/check - Vérifier si connecté
router.get('/check', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      success: true,
      authenticated: true,
      admin: {
        id: req.session.adminId,
        email: req.session.adminEmail
      }
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

// GET /api/auth/status - Statut de connexion
router.get('/status', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.session.adminId,
      email: req.session.adminEmail
    }
  });
});

module.exports = router;
module.exports.isAuthenticated = isAuthenticated;
