# Documentation Technique - SNTP Document Portal

## 📚 Table des matières

1. [Architecture](#architecture)
2. [Technologies utilisées](#technologies)
3. [Structure des fichiers](#structure)
4. [API Backend](#api-backend)
5. [Base de données](#base-de-donnees)
6. [Sécurité](#securite)
7. [Personnalisation](#personnalisation)
8. [Dépannage](#depannage)

## 🏗️ Architecture

L'application suit une architecture client-serveur:

```
┌─────────────────┐
│   Electron      │ ← Interface utilisateur (fenêtre native)
│  (Main Process) │
└────────┬────────┘
         │
         ├─→ ┌─────────────────┐
         │   │  Frontend       │ ← HTML/CSS/JavaScript
         │   │  (Renderer)     │
         │   └─────────────────┘
         │
         └─→ ┌─────────────────┐
             │  Backend        │ ← Node.js + Express
             │  (Server)       │
             └────────┬────────┘
                      │
                      └─→ ┌─────────────────┐
                          │  SQLite         │ ← Base de données
                          │  (Database)     │
                          └─────────────────┘
```

### Composants principaux

1. **Electron (electron.js)**
   - Crée la fenêtre de l'application
   - Démarre le serveur Node.js
   - Gère le cycle de vie de l'application

2. **Serveur Express (server/server.js)**
   - API REST pour les opérations CRUD
   - Gestion des sessions
   - Upload de fichiers
   - Service des fichiers statiques

3. **Base de données SQLite (server/database.js)**
   - Stockage des métadonnées
   - Gestion de l'arborescence
   - Authentification

4. **Frontend (public/)**
   - Interface utilisateur SPA
   - Navigation côté client
   - Gestion des formulaires

## 🛠️ Technologies utilisées

### Backend
- **Node.js** 18+ : Runtime JavaScript
- **Express** 4.x : Framework web
- **SQLite3** : Base de données embarquée
- **Multer** : Upload de fichiers
- **bcryptjs** : Hash des mots de passe
- **express-session** : Gestion des sessions

### Frontend
- **Vanilla JavaScript** : Pas de framework lourd
- **Bootstrap 5** : Framework CSS
- **Bootstrap Icons** : Icônes

### Desktop
- **Electron** 27.x : Framework desktop

## 📁 Structure des fichiers

```
razmed-desktop/
├── electron.js                 # Point d'entrée Electron
├── preload.js                 # Sécurité Electron
├── package.json               # Configuration npm
├── start.bat                  # Lanceur Windows
├── start.sh                   # Lanceur Linux/macOS
├── test-app.js               # Script de test
│
├── server/                    # Backend
│   ├── server.js             # Serveur Express
│   ├── database.js           # Configuration SQLite
│   └── routes/               # Routes API
│       ├── auth.js           # Authentification
│       ├── folders.js        # Gestion dossiers
│       └── files.js          # Gestion fichiers
│
├── public/                    # Frontend
│   ├── index.html            # Page HTML principale
│   ├── js/
│   │   └── app.js           # Application JavaScript
│   └── assets/              # Ressources
│       ├── icon.png         # Icône Linux
│       ├── icon.ico         # Icône Windows
│       └── icon.icns        # Icône macOS
│
├── uploads/                   # Fichiers uploadés
│   └── .gitkeep
│
└── database.sqlite           # Base de données (créée auto)
```

## 🔌 API Backend

### Authentification

#### POST /api/auth/login
Connecter un administrateur.

**Body:**
```json
{
  "email": "admin@sntp.dz",
  "password": "admin"
}
```

**Réponse succès:**
```json
{
  "success": true,
  "admin": {
    "id": 1,
    "email": "admin@sntp.dz"
  }
}
```

#### POST /api/auth/logout
Déconnecter l'utilisateur.

#### GET /api/auth/check
Vérifier l'état de connexion.

**Réponse:**
```json
{
  "success": true,
  "authenticated": true,
  "admin": { "id": 1, "email": "admin@sntp.dz" }
}
```

### Dossiers

#### GET /api/folders
Récupérer tous les dossiers.

**Réponse:**
```json
{
  "success": true,
  "folders": [
    {
      "id": 1,
      "name": "Documents",
      "parent_id": null,
      "created_at": "2025-01-01 10:00:00"
    }
  ]
}
```

#### GET /api/folders/:id
Récupérer un dossier spécifique avec ses sous-dossiers et fichiers.

**Réponse:**
```json
{
  "success": true,
  "folder": { "id": 1, "name": "Documents", ... },
  "subfolders": [...],
  "files": [...]
}
```

#### POST /api/folders
Créer un nouveau dossier (admin).

**Body:**
```json
{
  "name": "Nouveau Dossier",
  "parent_id": 1
}
```

#### PUT /api/folders/:id
Modifier un dossier (admin).

**Body:**
```json
{
  "name": "Dossier Renommé"
}
```

#### DELETE /api/folders/:id
Supprimer un dossier (admin).

#### GET /api/folders/:id/path
Récupérer le chemin complet (breadcrumb).

**Réponse:**
```json
{
  "success": true,
  "path": [
    { "id": 1, "name": "Documents" },
    { "id": 2, "name": "2024" }
  ]
}
```

#### GET /api/folders/:id/count
Compter les fichiers dans un dossier (récursif).

### Fichiers

#### GET /api/files
Récupérer tous les fichiers.

#### GET /api/files/:id
Récupérer un fichier spécifique.

#### POST /api/files/upload
Uploader un fichier (admin).

**Form-data:**
- `file`: Le fichier
- `folder_id`: ID du dossier

#### POST /api/files/upload-folder
Uploader un dossier complet (admin).

**Form-data:**
- `files[]`: Tableau de fichiers
- `folderStructure`: JSON de la structure

#### GET /api/files/:id/download
Télécharger un fichier.

#### DELETE /api/files/:id
Supprimer un fichier (admin).

## 💾 Base de données

### Schéma

```sql
-- Table admins
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table folders
CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Table files
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

### Relations

```
admins (1) ─────────┐
                    │ (gestion)
                    ▼
folders (N) ◄──── folders (parent-child)
    │
    │ (1:N)
    ▼
files (N)
```

### Requêtes courantes

```javascript
// Récupérer l'arborescence complète
const folders = await all('SELECT * FROM folders ORDER BY parent_id, name');

// Récupérer les dossiers racine
const rootFolders = await all('SELECT * FROM folders WHERE parent_id IS NULL');

// Compter les fichiers dans un dossier
const count = await get('SELECT COUNT(*) as count FROM files WHERE folder_id = ?', [id]);

// Récupérer les fichiers d'un dossier
const files = await all('SELECT * FROM files WHERE folder_id = ? ORDER BY uploaded_at DESC', [id]);
```

## 🔒 Sécurité

### Authentification
- Mots de passe hashés avec **bcrypt** (10 rounds)
- Sessions sécurisées avec **express-session**
- Cookie httpOnly et secure en production

### Protection des routes
```javascript
// Middleware de protection
function isAuthenticated(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Non authentifié' });
  }
}

// Utilisation
router.post('/api/folders', isAuthenticated, async (req, res) => {
  // Code protégé
});
```

### Validation des uploads
- Limite de taille: 100 MB par fichier
- Noms de fichiers sécurisés (caractères spéciaux supprimés)
- Vérification du type MIME
- Stockage avec noms uniques (timestamp + UUID)

### SQL Injection
- Utilisation de requêtes préparées (prepared statements)
- Paramètres bindés: `db.run('SELECT * FROM users WHERE id = ?', [id])`

### XSS Protection
- Échappement HTML: `htmlspecialchars()` équivalent
- Content Security Policy (à ajouter si besoin)

## 🎨 Personnalisation

### Modifier les couleurs

Dans `public/index.html` et `public/js/app.js`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}
```

### Modifier le logo

Remplacez les fichiers dans `public/assets/`:
- `icon.png` (512x512)
- `icon.ico` (multi-résolutions)
- `icon.icns` (multi-résolutions)

### Modifier le nom de l'entreprise

Dans `public/index.html` et `public/js/app.js`, cherchez "Société Nationale des Travaux Publics" et remplacez.

Dans `package.json`:
```json
{
  "name": "votre-nom-entreprise-portal",
  "description": "Votre description",
  "build": {
    "productName": "Votre Nom Application"
  }
}
```

### Ajouter un nouveau type de fichier

Dans `public/js/app.js`, méthode `renderFiles()`:

```javascript
const fileIcons = {
  'pdf': 'bi-file-earmark-pdf',
  'mp4': 'bi-file-earmark-play', // Nouveau type
  // ...
};
```

### Modifier la limite d'upload

Dans `server/routes/files.js`:

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB au lieu de 100 MB
  }
});
```

### Ajouter des champs personnalisés

1. Modifier le schéma de la base:
```javascript
// Dans server/database.js
db.run(`
  ALTER TABLE files ADD COLUMN description TEXT;
  ALTER TABLE files ADD COLUMN tags TEXT;
`);
```

2. Modifier les routes pour accepter les nouveaux champs

3. Modifier le frontend pour afficher/éditer ces champs

## 🐛 Dépannage

### L'application ne démarre pas

**Symptôme:** Erreur au lancement

**Solutions:**
1. Vérifier Node.js: `node --version` (doit être ≥ 18)
2. Réinstaller les dépendances: `rm -rf node_modules && npm install`
3. Vérifier les logs dans la console

### Erreur de port

**Symptôme:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```javascript
// Dans server/server.js
const PORT = 3002; // Changer le port
```

Ou tuer le processus:
```bash
# Linux/macOS
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### La base de données est corrompue

**Solution:**
1. Sauvegarder `database.sqlite`
2. Supprimer `database.sqlite`
3. Relancer l'application (créera une nouvelle DB)
4. Migrer les données si nécessaire

### Fichiers uploadés introuvables

**Symptôme:** Erreur 404 lors de l'accès aux fichiers

**Solution:**
1. Vérifier que `uploads/` existe
2. Vérifier les permissions: `chmod -R 755 uploads/`
3. Vérifier les chemins dans la DB (doivent être relatifs)

### Erreur de mémoire lors de l'upload

**Symptôme:** `JavaScript heap out of memory`

**Solution:**
```bash
# Augmenter la mémoire Node.js
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### L'icône n'apparaît pas après compilation

**Solution:**
1. Vérifier que les icônes existent dans `public/assets/`
2. Reconstruire: `npm run build`
3. Vider le cache Electron: supprimer le dossier `dist/`

## 📊 Performances

### Optimisations recommandées

1. **Indexer la base de données:**
```sql
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_files_folder ON files(folder_id);
```

2. **Paginer les résultats:**
```javascript
const limit = 50;
const offset = (page - 1) * limit;
const files = await all(
  'SELECT * FROM files LIMIT ? OFFSET ?',
  [limit, offset]
);
```

3. **Compresser les réponses:**
```javascript
const compression = require('compression');
app.use(compression());
```

4. **Mettre en cache les résultats fréquents:**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
```

## 📝 Logs

### Activer les logs détaillés

Dans `server/server.js`:

```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

### Logs dans un fichier

```javascript
const fs = require('fs');
const path = require('path');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
```

## 🔄 Mises à jour

### Mettre à jour les dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour toutes les dépendances
npm update

# Mettre à jour une dépendance spécifique
npm install express@latest
```

### Mettre à jour Electron

```bash
npm install electron@latest --save-dev
```

## 🚀 Déploiement

### Créer un installateur

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Distribution

Les fichiers compilés se trouvent dans `dist/`:
- Windows: `.exe` (installateur NSIS)
- macOS: `.dmg` (image disque)
- Linux: `.AppImage` ou `.deb`

---

**Pour plus d'aide, consultez:**
- [Documentation Electron](https://www.electronjs.org/docs)
- [Documentation Express](https://expressjs.com/)
- [Documentation SQLite](https://www.sqlite.org/docs.html)
