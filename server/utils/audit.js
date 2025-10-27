const path = require('path');
const fs = require('fs-extra');
const { run, get, all } = require('../database');

// Types d'actions pour l'audit
const ACTION_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FOLDER_CREATE: 'FOLDER_CREATE',
  FOLDER_DELETE: 'FOLDER_DELETE',
  FOLDER_UPDATE: 'FOLDER_UPDATE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DELETE: 'FILE_DELETE',
  FILE_DOWNLOAD: 'FILE_DOWNLOAD',
  FILE_PREVIEW: 'FILE_PREVIEW',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING'
};

// Initialiser la table d'audit
function initAuditTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action_type TEXT NOT NULL,
      action_description TEXT,
      resource_name TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    run(sql, []);
    console.log('✅ Table audit_logs initialisée');
  } catch (error) {
    console.error('❌ Erreur initialisation table audit_logs:', error);
  }
}

// Logger une action d'audit
async function logAudit(data) {
  try {
    const {
      userId = null,
      userEmail = null,
      actionType,
      actionDescription = '',
      resourceName = null,
      resourceId = null,
      ipAddress = null,
      userAgent = null,
      success = true,
      errorMessage = null,
      req = null
    } = data;

    // Extraire des informations de la requête si fournie
    let finalIpAddress = ipAddress;
    let finalUserAgent = userAgent;
    let finalUserId = userId;
    let finalUserEmail = userEmail;

    if (req) {
      finalIpAddress = finalIpAddress || req.ip || req.connection.remoteAddress;
      finalUserAgent = finalUserAgent || req.get('User-Agent');
      finalUserId = finalUserId || req.session?.adminId;
      finalUserEmail = finalUserEmail || req.session?.adminEmail;
    }

    await run(
      `INSERT INTO audit_logs (
        user_id, user_email, action_type, action_description,
        resource_name, resource_id, ip_address, user_agent,
        success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId,
        finalUserEmail,
        actionType,
        actionDescription,
        resourceName,
        resourceId,
        finalIpAddress,
        finalUserAgent,
        success ? 1 : 0,
        errorMessage
      ]
    );
  } catch (error) {
    console.error('❌ Erreur lors du logging d\'audit:', error);
  }
}

// Middleware d'audit pour les requêtes HTTP
function auditMiddleware(req, res, next) {
  // Logger certaines actions automatiquement
  const originalSend = res.send;
  
  res.send = function(body) {
    // Logger les erreurs 4xx et 5xx
    if (res.statusCode >= 400) {
      logAudit({
        actionType: res.statusCode >= 500 ? ACTION_TYPES.SYSTEM_ERROR : ACTION_TYPES.SYSTEM_WARNING,
        actionDescription: `HTTP ${res.statusCode} - ${req.method} ${req.url}`,
        errorMessage: typeof body === 'string' ? body : JSON.stringify(body),
        success: false,
        req
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

// Récupérer les logs d'audit
async function getAuditLogs(limit = 100, offset = 0) {
  try {
    const logs = await all(
      `SELECT * FROM audit_logs 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const total = await get('SELECT COUNT(*) as count FROM audit_logs');
    
    return {
      logs,
      total: total.count
    };
  } catch (error) {
    console.error('❌ Erreur récupération logs audit:', error);
    return { logs: [], total: 0 };
  }
}

module.exports = {
  ACTION_TYPES,
  initAuditTable,
  logAudit,
  auditMiddleware,
  getAuditLogs
};

