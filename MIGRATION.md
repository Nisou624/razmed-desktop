# Guide de Migration - PHP vers Electron

Ce guide vous aide à migrer vos données de l'ancienne application PHP vers la nouvelle application Electron.

## 📊 Migration de la base de données

### Option 1: Migration automatique avec script

Créez un fichier `migrate.js` à la racine du projet:

```javascript
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

async function migrate() {
  // Connexion MySQL (ancienne base)
  const mysqlConn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'portal'
  });

  // Connexion SQLite (nouvelle base)
  const sqliteDb = new sqlite3.Database('./database.sqlite');

  console.log('🔄 Début de la migration...');

  // Migrer les admins
  console.log('📝 Migration des administrateurs...');
  const [admins] = await mysqlConn.execute('SELECT * FROM admins');
  
  for (const admin of admins) {
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO admins (email, password, created_at) VALUES (?, ?, ?)',
        [admin.email, admin.password, admin.created_at],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
  console.log(`✅ ${admins.length} administrateur(s) migré(s)`);

  // Migrer les dossiers
  console.log('📁 Migration des dossiers...');
  const [folders] = await mysqlConn.execute('SELECT * FROM folders ORDER BY id ASC');
  
  for (const folder of folders) {
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO folders (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)',
        [folder.id, folder.name, folder.parent_id, folder.created_at],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
  console.log(`✅ ${folders.length} dossier(s) migré(s)`);

  // Migrer les fichiers
  console.log('📄 Migration des fichiers...');
  const [files] = await mysqlConn.execute('SELECT * FROM files ORDER BY id ASC');
  
  for (const file of files) {
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO files (id, folder_id, filename, filepath, uploaded_at) VALUES (?, ?, ?, ?, ?)',
        [file.id, file.folder_id, file.filename, file.filepath, file.uploaded_at],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
  console.log(`✅ ${files.length} fichier(s) migré(s)`);

  // Fermer les connexions
  await mysqlConn.end();
  sqliteDb.close();

  console.log('✅ Migration terminée avec succès !');
}

migrate().catch(console.error);
```

Installez mysql2:
```bash
npm install mysql2
```

Exécutez la migration:
```bash
node migrate.js
```

### Option 2: Migration manuelle

#### 1. Exporter les données MySQL

```sql
-- Exporter les admins
SELECT * FROM admins INTO OUTFILE '/tmp/admins.csv' 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n';

-- Exporter les dossiers
SELECT * FROM folders INTO OUTFILE '/tmp/folders.csv' 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n';

-- Exporter les fichiers
SELECT * FROM files INTO OUTFILE '/tmp/files.csv' 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n';
```

#### 2. Importer dans SQLite

Utilisez DB Browser for SQLite ou un script Python pour importer les CSV.

## 📁 Migration des fichiers

### Copier le dossier uploads

```bash
# Linux/macOS
cp -r /chemin/vers/ancien/projet/uploads/* ./uploads/

# Windows
xcopy /E /I C:\chemin\vers\ancien\projet\uploads .\uploads
```

### Vérifier les chemins de fichiers

Les chemins dans la base de données doivent être relatifs à partir du dossier racine:
- ✅ Correct: `uploads/fichier.pdf`
- ❌ Incorrect: `/var/www/uploads/fichier.pdf`

Script de correction des chemins:

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT * FROM files', [], (err, files) => {
  if (err) throw err;
  
  files.forEach(file => {
    let newPath = file.filepath;
    
    // Corriger les chemins absolus
    if (newPath.includes('/var/www/')) {
      newPath = newPath.replace(/.*uploads\//, 'uploads/');
    }
    
    if (newPath.includes('C:\\')) {
      newPath = newPath.replace(/.*uploads\\/, 'uploads/');
      newPath = newPath.replace(/\\/g, '/');
    }
    
    if (newPath !== file.filepath) {
      db.run('UPDATE files SET filepath = ? WHERE id = ?', [newPath, file.id]);
      console.log(`Corrigé: ${file.filepath} -> ${newPath}`);
    }
  });
  
  db.close();
});
```

## 🔐 Migration des mots de passe

Les mots de passe doivent être hashés avec bcrypt.

Si vos anciens mots de passe ne sont pas en bcrypt:

```javascript
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

async function rehashPasswords() {
  db.all('SELECT * FROM admins', [], async (err, admins) => {
    if (err) throw err;
    
    for (const admin of admins) {
      // Si le mot de passe n'est pas déjà en bcrypt
      if (!admin.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        db.run('UPDATE admins SET password = ? WHERE id = ?', 
          [hashedPassword, admin.id]
        );
        console.log(`Mot de passe rehashé pour: ${admin.email}`);
      }
    }
    
    db.close();
  });
}

rehashPasswords();
```

## 🧪 Vérification post-migration

### 1. Vérifier la base de données

```bash
# Installer sqlite3 CLI
npm install -g sqlite3

# Ouvrir la base
sqlite3 database.sqlite

# Vérifier les tables
.tables

# Compter les enregistrements
SELECT COUNT(*) FROM folders;
SELECT COUNT(*) FROM files;
SELECT COUNT(*) FROM admins;
```

### 2. Vérifier les fichiers

```bash
# Lister tous les fichiers
ls -R uploads/

# Compter les fichiers
find uploads/ -type f | wc -l
```

### 3. Tester l'application

1. Démarrez l'application: `npm start`
2. Connectez-vous avec vos identifiants
3. Vérifiez que tous les dossiers sont visibles
4. Testez l'ouverture de quelques fichiers
5. Testez le téléchargement de fichiers

## ⚠️ Points d'attention

### Différences PHP vs Node.js

1. **Sessions**: Les sessions PHP ne sont pas compatibles. Les utilisateurs devront se reconnecter.

2. **Chemins de fichiers**: 
   - PHP: Chemins absolus possibles
   - Node.js: Préférer les chemins relatifs

3. **Upload de fichiers**:
   - Limite de taille par défaut: 100 MB
   - Modifier dans `server/routes/files.js` si nécessaire

4. **Extensions de fichiers**:
   - Vérifier que toutes les extensions sont supportées
   - Ajouter de nouvelles extensions dans l'icône de fichier

### Problèmes courants

**Erreur "FOREIGN KEY constraint failed"**
- Les IDs des dossiers parents doivent exister avant les enfants
- Migrer les dossiers par ordre d'ID croissant

**Fichiers introuvables**
- Vérifier les chemins relatifs dans la base
- Vérifier que tous les fichiers sont dans `uploads/`

**Erreur de connexion**
- Vérifier que le port 3001 est libre
- Changer le port si nécessaire dans `server/server.js`

## 📝 Checklist de migration

- [ ] Base de données MySQL exportée
- [ ] Dossier `uploads/` copié
- [ ] Script de migration exécuté
- [ ] Chemins de fichiers vérifiés
- [ ] Mots de passe rehashés
- [ ] Nombre d'enregistrements vérifié
- [ ] Application testée
- [ ] Connexion admin fonctionnelle
- [ ] Upload de fichiers testé
- [ ] Téléchargement de fichiers testé

## 🆘 Support

En cas de problème pendant la migration:
1. Gardez une sauvegarde de l'ancienne base de données
2. Gardez une copie du dossier `uploads/`
3. Notez les messages d'erreur exacts
4. Consultez les logs du serveur

---

**Important**: Effectuez toujours une migration sur une copie des données avant de migrer la production !
