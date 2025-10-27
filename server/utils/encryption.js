const crypto = require('crypto');
const { run, get, all } = require('../database');

// Clé de chiffrement (à changer en production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sntp-encryption-key-32-characters!';
const IV_LENGTH = 16; // Pour AES, c'est toujours 16

// Initialiser la table de configuration du chiffrement
function initEncryptionTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS encryption_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_name TEXT UNIQUE NOT NULL,
      encrypted_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    run(sql, []);
    console.log('✅ Table encryption_config initialisée');
  } catch (error) {
    console.error('❌ Erreur initialisation table encryption_config:', error);
  }
}

// Chiffrer une valeur
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Erreur chiffrement:', error);
    return null;
  }
}

// Déchiffrer une valeur
function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Format de données chiffrées invalide');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Erreur déchiffrement:', error);
    return null;
  }
}

// Sauvegarder une valeur chiffrée
async function saveEncryptedValue(keyName, value) {
  try {
    const encryptedValue = encrypt(value);
    if (!encryptedValue) {
      throw new Error('Échec du chiffrement');
    }
    
    await run(
      `INSERT OR REPLACE INTO encryption_config (key_name, encrypted_value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [keyName, encryptedValue]
    );
    
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde valeur chiffrée:', error);
    return false;
  }
}

// Récupérer une valeur déchiffrée
async function getDecryptedValue(keyName) {
  try {
    const row = await get(
      'SELECT encrypted_value FROM encryption_config WHERE key_name = ?',
      [keyName]
    );
    
    if (!row) {
      return null;
    }
    
    return decrypt(row.encrypted_value);
  } catch (error) {
    console.error('❌ Erreur récupération valeur déchiffrée:', error);
    return null;
  }
}

// Générer un hash sécurisé
function generateHash(data, salt = null) {
  try {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 10000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltToUse
    };
  } catch (error) {
    console.error('❌ Erreur génération hash:', error);
    return null;
  }
}

// Vérifier un hash
function verifyHash(data, hash, salt) {
  try {
    const result = generateHash(data, salt);
    return result && result.hash === hash;
  } catch (error) {
    console.error('❌ Erreur vérification hash:', error);
    return false;
  }
}

module.exports = {
  initEncryptionTable,
  encrypt,
  decrypt,
  saveEncryptedValue,
  getDecryptedValue,
  generateHash,
  verifyHash
};
