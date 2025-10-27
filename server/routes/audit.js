const express = require('express');
const { isAuthenticated } = require('./auth');
const { getAuditLogs, getAuditStats } = require('../utils/audit');

const router = express.Router();

// GET /api/audit/logs - Récupérer les logs d'audit
router.get('/logs', isAuthenticated, async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      actionType: req.query.actionType || null,
      resourceType: req.query.resourceType || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const logs = await getAuditLogs(filters);

    res.json({
      success: true,
      logs,
      count: logs.length,
      filters
    });

  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs'
    });
  }
});

// GET /api/audit/stats - Obtenir les statistiques
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const stats = await getAuditStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
