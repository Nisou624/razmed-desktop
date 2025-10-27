const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');

// Chemin de la base de données
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Créer la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur ouverture base de données:', err);
  } else {
    console.log('✅ Base de données connectée');
    initDatabase();
  }
});

// Initialiser la structure de la base de données
function initDatabase() {
  // Table admins
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erreur création table admins:', err);
    } else {
      // Créer l'admin par défaut
      createDefaultAdmin();
    }
  });

  // Table folders
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Erreur création table folders:', err);
    }
  });

  // Table files
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Erreur création table files:', err);
    }
  });

  console.log('✅ Tables créées avec succès');
}

// Créer l'administrateur par défaut
function createDefaultAdmin() {
  const defaultEmail = 'admin@sntp.dz';
  const defaultPassword = 'admin'; // À changer en production

  db.get('SELECT * FROM admins WHERE email = ?', [defaultEmail], async (err, row) => {
    if (err) {
      console.error('Erreur vérification admin:', err);
      return;
    }

    if (!row) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      db.run(
        'INSERT INTO admins (email, password) VALUES (?, ?)',
        [defaultEmail, hashedPassword],
        (err) => {
          if (err) {
            console.error('Erreur création admin par défaut:', err);
          } else {
            console.log('✅ Admin par défaut créé (email: admin@sntp.dz, password: admin)');
          }
        }
      );
    }
  });
}

// Fonctions utilitaires pour les requêtes

// Exécuter une requête simple
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Obtenir une seule ligne
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Obtenir toutes les lignes
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Fermer la base de données
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  close
};
