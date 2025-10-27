# SNTP Document Portal - Application Desktop

Application de gestion documentaire pour la Société Nationale des Travaux Publics (SNTP) avec système avancé de prévisualisation et de permissions.

## 📋 Prérequis

- **Node.js** version 18 ou supérieure
- **npm** (fourni avec Node.js)
- Système d'exploitation : Windows, macOS ou Linux

## 🚀 Installation

### 1. Installer Node.js

Téléchargez et installez Node.js depuis [nodejs.org](https://nodejs.org/)

### 2. Cloner ou télécharger le projet

```bash
cd razmed-desktop
```

### 3. Installer les dépendances

```bash
npm install
```

## 🎯 Utilisation

### Lancer l'application en mode développement

```bash
npm start
```

### Compiler l'application pour distribution

#### Pour Windows:
```bash
npm run build:win
```

#### Pour macOS:
```bash
npm run build:mac
```

#### Pour Linux:
```bash
npm run build:linux
```

L'exécutable sera créé dans le dossier `dist/`

## 👤 Connexion Administrateur

**Identifiants par défaut:**
- Email: `admin@sntp.dz`
- Mot de passe: `admin`

⚠️ **Important:** Changez le mot de passe par défaut en production

## 📁 Structure du projet

```
razmed-desktop/
├── electron.js              # Point d'entrée Electron
├── preload.js              # Script de sécurité Electron
├── package.json            # Configuration npm
├── server/                 # Serveur backend
│   ├── server.js          # Serveur Express
│   ├── database.js        # Configuration SQLite
│   └── routes/            # Routes API
│       ├── auth.js        # Authentification
│       ├── folders.js     # Gestion dossiers
│       ├── files.js       # Gestion fichiers
│       └── preview.js     # Prévisualisation (NOUVEAU)
├── public/                # Frontend
│   ├── index.html        # Page HTML principale
│   └── js/
│       └── app.js        # Application JavaScript
├── uploads/              # Fichiers uploadés
└── database.sqlite       # Base de données (créée automatiquement)
```

## 🔧 Fonctionnalités

### Pour les utilisateurs:
- ✅ Navigation dans l'arborescence de dossiers
- ✅ **Prévisualisation avancée des fichiers**
  - PDF : Visualisation intégrée (pas de téléchargement)
  - Word (.docx) : Conversion HTML avec styles
  - Excel (.xlsx) : Tableaux interactifs multi-feuilles
  - Images : Affichage haute qualité
  - Texte : Formatage préservé
- ✅ Téléchargement sélectif selon le type de fichier
- ✅ Fil d'Ariane (breadcrumb) pour la navigation
- ✅ Interface responsive et moderne
- ✅ Badges de permissions visuels

### Pour les administrateurs:
- ✅ Création/modification/suppression de dossiers
- ✅ Upload de fichiers individuels
- ✅ Upload de dossiers complets avec arborescence (drag & drop)
- ✅ Gestion hiérarchique des dossiers
- ✅ Authentification sécurisée

## 🔐 Permissions des fichiers

### Types de fichiers et restrictions

| Type | Extensions | Prévisualisation | Téléchargement | Détails |
|------|-----------|------------------|----------------|---------|
| **PDF** | .pdf | ✅ Oui | ❌ **Non** | Vue seule, protégé contre le téléchargement |
| **Word** | .doc, .docx | ✅ Oui | ✅ Oui | Conversion HTML, téléchargeable |
| **Excel** | .xls, .xlsx | ✅ Oui | ✅ Oui | Tableaux HTML, téléchargeable |
| **Images** | .jpg, .png, .gif | ✅ Oui | ✅ Oui | Affichage direct |
| **Texte** | .txt | ✅ Oui | ✅ Oui | Affichage formaté |

### Protection des PDF

Les fichiers PDF sont **protégés contre le téléchargement direct** :
- ❌ Accès direct bloqué au niveau serveur
- ❌ Bouton téléchargement désactivé
- ✅ Uniquement visualisables via prévisualisation
- 🔒 Headers HTTP spéciaux pour empêcher le cache

**Note** : Un utilisateur avancé peut toujours faire une capture d'écran ou utiliser "Imprimer en PDF".

## 🎨 Prévisualisation des documents

### Fonctionnalités de prévisualisation

- 🖼️ **Modale plein écran** avec interface moderne
- 📄 **Conversion intelligente** selon le type de fichier
- 🎨 **Mise en forme préservée** (styles, tableaux, images)
- 💧 **Watermark** personnalisable (logo SNTP)
- ⚡ **Chargement progressif** avec indicateur
- ⌨️ **Raccourcis clavier** (Echap pour fermer)
- 📱 **Design responsive** adapté à tous les écrans

### Types supportés

**Word (.docx, .doc)**
- Texte formaté (gras, italique, souligné)
- Titres et paragraphes
- Listes à puces et numérotées
- Tableaux avec styles
- Images intégrées

**Excel (.xlsx, .xls)**
- Toutes les feuilles du classeur
- Tableaux formatés
- Données de cellules
- Navigation par onglets

**PDF (.pdf)**
- Affichage natif dans iframe
- Zoom et navigation
- Pas de téléchargement

**Images (.jpg, .png, .gif)**
- Affichage haute résolution
- Zoom responsive

**Texte (.txt)**
- Formatage monospace
- Préservation des sauts de ligne

## 🔒 Sécurité

### Authentification
- Mots de passe hashés avec **bcrypt** (10 rounds)
- Sessions sécurisées avec **express-session**
- Cookie httpOnly et secure en production

### Protection des documents
- **PDF** : Accès direct bloqué, headers de sécurité
- **Validation des uploads** : Taille et type vérifiés
- **Noms de fichiers sécurisés** : Caractères spéciaux supprimés
- **SQL Injection** : Requêtes préparées
- **XSS Protection** : Échappement HTML

## 📦 Base de données

L'application utilise SQLite pour stocker:
- Comptes administrateurs
- Structure des dossiers
- Métadonnées des fichiers

La base de données est créée automatiquement au premier lancement dans `database.sqlite`

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez que Node.js est installé: `node --version`
2. Réinstallez les dépendances: `npm install`
3. Supprimez `node_modules` et réinstallez: `rm -rf node_modules && npm install`

### Erreur de port

Si le port 3001 est déjà utilisé, modifiez le dans `server/server.js`:
```javascript
const PORT = 3002; // Changez le numéro
```

### Problème de prévisualisation

1. Vérifiez que les dépendances sont installées:
```bash
npm list mammoth xlsx pdf-lib
```

2. Testez les permissions:
```bash
node test-permissions.js
```

3. Vérifiez les logs du serveur dans la console

### PDF ne s'affiche pas

- Vérifiez que le fichier existe dans `uploads/`
- Testez l'accès à `/api/preview/ID` directement dans le navigateur
- Consultez les logs du serveur pour les erreurs

### Word/Excel mal formaté

- Les styles complexes peuvent être approximatifs
- Simplifiez le document source si possible
- Consultez `FILE_PERMISSIONS.md` pour plus de détails

## 🧪 Tests

### Tester l'application

```bash
# Test complet de l'application
node test-app.js

# Test des permissions de fichiers
node test-permissions.js
```

### Tests manuels

1. Uploader un PDF → Vérifier qu'il n'est pas téléchargeable
2. Uploader un Word → Vérifier la prévisualisation et le téléchargement
3. Uploader un Excel → Vérifier l'affichage multi-feuilles
4. Tenter d'accéder directement à `/uploads/fichier.pdf` → Doit être bloqué

## 📝 Modification du mot de passe admin

1. Se connecter avec le compte admin
2. Modifier `server/routes/auth.js` pour ajouter une route de changement de mot de passe
3. Ou directement dans la base de données avec un hash bcrypt

## 🔄 Mise à jour

Pour mettre à jour les dépendances:

```bash
npm update
```

Pour mettre à jour vers une nouvelle version:

```bash
# Sauvegarder database.sqlite et uploads/
git pull  # ou télécharger la nouvelle version
npm install
# Restaurer database.sqlite et uploads/
```

## 📚 Documentation complète

- **FILE_PERMISSIONS.md** - Guide des permissions et prévisualisation
- **DOCUMENTATION.md** - Documentation technique complète
- **MIGRATION.md** - Migrer depuis l'ancienne version PHP
- **QUICKSTART.md** - Guide de démarrage rapide
- **ICONS.md** - Guide de création des icônes

## 📞 Support

Pour toute question ou problème:
1. Consultez la documentation dans le dossier du projet
2. Vérifiez les logs du serveur
3. Testez avec `node test-app.js` et `node test-permissions.js`
4. Contactez l'équipe de développement SNTP

## 📄 Licence

© 2025 Société Nationale des Travaux Publics - Tous droits réservés

---

## 🆕 Nouveautés version 1.0

### Système de prévisualisation avancé
- ✨ Prévisualisation intégrée pour PDF, Word, Excel, images et texte
- 🔒 Protection des PDF contre le téléchargement
- 🎨 Conversion intelligente des documents Office en HTML
- 💧 Watermarks personnalisables
- 📱 Interface responsive et moderne

### Permissions granulaires
- 📄 PDF : Vue seule (pas de téléchargement)
- 📝 Word/Excel : Visualisable et téléchargeable
- 🏷️ Badges visuels pour indiquer les permissions
- 🔐 Blocage au niveau serveur pour sécurité maximale

### Améliorations techniques
- ⚡ Chargement progressif des prévisualisations
- 🎯 Détection automatique du type de fichier
- 🛡️ Headers de sécurité renforcés
- 📊 Support multi-feuilles pour Excel
- 🎨 Préservation des styles dans Word

---

**Version:** 1.0.0  
**Dernière mise à jour:** Octobre 2025# SNTP Document Portal - Application Desktop

Application de gestion documentaire pour la Société Nationale des Travaux Publics (SNTP).

## 📋 Prérequis

- **Node.js** version 18 ou supérieure
- **npm** (fourni avec Node.js)
- Système d'exploitation : Windows, macOS ou Linux

## 🚀 Installation

### 1. Installer Node.js

Téléchargez et installez Node.js depuis [nodejs.org](https://nodejs.org/)

### 2. Cloner ou télécharger le projet

```bash
cd razmed-desktop
```

### 3. Installer les dépendances

```bash
npm install
```

## 🎯 Utilisation

### Lancer l'application en mode développement

```bash
npm start
```

### Compiler l'application pour distribution

#### Pour Windows:
```bash
npm run build:win
```

#### Pour macOS:
```bash
npm run build:mac
```

#### Pour Linux:
```bash
npm run build:linux
```

L'exécutable sera créé dans le dossier `dist/`

## 👤 Connexion Administrateur

**Identifiants par défaut:**
- Email: `admin@sntp.dz`
- Mot de passe: `admin`

⚠️ **Important:** Changez le mot de passe par défaut en production

## 📁 Structure du projet

```
razmed-desktop/
├── electron.js              # Point d'entrée Electron
├── preload.js              # Script de sécurité Electron
├── package.json            # Configuration npm
├── server/                 # Serveur backend
│   ├── server.js          # Serveur Express
│   ├── database.js        # Configuration SQLite
│   └── routes/            # Routes API
│       ├── auth.js        # Authentification
│       ├── folders.js     # Gestion dossiers
│       └── files.js       # Gestion fichiers
├── public/                # Frontend
│   ├── index.html        # Page HTML principale
│   └── js/
│       └── app.js        # Application JavaScript
├── uploads/              # Fichiers uploadés
└── database.sqlite       # Base de données (créée automatiquement)
```

## 🔧 Fonctionnalités

### Pour les utilisateurs:
- ✅ Navigation dans l'arborescence de dossiers
- ✅ Visualisation des fichiers
- ✅ Téléchargement des documents
- ✅ Fil d'Ariane (breadcrumb) pour la navigation
- ✅ Interface responsive et moderne

### Pour les administrateurs:
- ✅ Création/modification/suppression de dossiers
- ✅ Upload de fichiers individuels
- ✅ Upload de dossiers complets avec arborescence (drag & drop)
- ✅ Gestion hiérarchique des dossiers
- ✅ Authentification sécurisée

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt
- Sessions sécurisées
- Protection CSRF
- Validation des uploads
- SQLite en mode local (pas d'accès réseau)

## 📦 Base de données

L'application utilise SQLite pour stocker:
- Comptes administrateurs
- Structure des dossiers
- Métadonnées des fichiers

La base de données est créée automatiquement au premier lancement dans `database.sqlite`

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez que Node.js est installé: `node --version`
2. Réinstallez les dépendances: `npm install`
3. Supprimez `node_modules` et réinstallez: `rm -rf node_modules && npm install`

### Erreur de port

Si le port 3001 est déjà utilisé, modifiez le dans `server/server.js`:
```javascript
const PORT = 3002; // Changez le numéro
```

### Problème d'upload

1. Vérifiez que le dossier `uploads/` existe
2. Vérifiez les permissions d'écriture
3. Vérifiez la taille maximale des fichiers (100 MB par défaut)

## 📝 Modification du mot de passe admin

1. Se connecter avec le compte admin
2. Modifier `server/routes/auth.js` pour ajouter une route de changement de mot de passe
3. Ou directement dans la base de données avec un hash bcrypt

## 🔄 Mise à jour

Pour mettre à jour les dépendances:

```bash
npm update
```

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement SNTP.

## 📄 Licence

© 2025 Société Nationale des Travaux Publics - Tous droits réservés

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025
