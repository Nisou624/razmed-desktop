# 🚀 Guide de Démarrage Rapide

Ce guide vous permet de démarrer l'application en 5 minutes.

## ⚡ Démarrage Ultra-Rapide

### Windows

1. **Double-cliquez sur `start.bat`**

C'est tout ! L'application va:
- Vérifier Node.js
- Installer les dépendances (si nécessaire)
- Démarrer l'application

### Linux / macOS

1. **Ouvrez un terminal dans le dossier du projet**

2. **Rendez le script exécutable:**
```bash
chmod +x start.sh
```

3. **Exécutez le script:**
```bash
./start.sh
```

## 📝 Installation Manuelle

Si les scripts ne fonctionnent pas:

### Étape 1: Installer Node.js

Téléchargez depuis [nodejs.org](https://nodejs.org/) (version 18 ou supérieure).

### Étape 2: Installer les dépendances

```bash
npm install
```

### Étape 3: Démarrer l'application

```bash
npm start
```

## 🎯 Premier Usage

### 1. L'application s'ouvre automatiquement

Une fenêtre Electron s'ouvrira après quelques secondes.

### 2. Vue publique

Vous verrez la liste des dossiers (vide au début).

### 3. Se connecter comme administrateur

1. Cliquez sur **"Connexion Admin"**
2. Utilisez les identifiants par défaut:
   - **Email:** `admin@sntp.dz`
   - **Mot de passe:** `admin`

### 4. Créer votre premier dossier

1. Cliquez sur **"Nouveau Dossier"**
2. Entrez un nom (ex: "Documents 2025")
3. Cliquez sur **"Créer"**

### 5. Uploader des fichiers

**Méthode 1: Drag & Drop**
- Glissez un dossier complet depuis votre explorateur
- Déposez-le dans la zone prévue
- L'arborescence complète sera créée automatiquement

**Méthode 2: Upload classique**
- Cliquez dans la zone d'upload
- Sélectionnez un dossier avec ses sous-dossiers
- Validez

### 6. Naviguer dans les dossiers

- Cliquez sur un dossier pour l'ouvrir
- Utilisez le fil d'Ariane (breadcrumb) pour remonter
- Cliquez sur "Retour à l'accueil" pour revenir à la racine

## 🔑 Changement du mot de passe admin

⚠️ **IMPORTANT:** Changez le mot de passe par défaut !

Pour le moment, vous devez le changer manuellement dans la base de données:

```bash
# Ouvrir la base de données
sqlite3 database.sqlite

# Générer un nouveau hash (utilisez un outil en ligne ou Node.js)
# Exemple avec Node.js:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NOUVEAU_MOT_DE_PASSE', 10));"

# Mettre à jour dans SQLite
UPDATE admins SET password = 'HASH_GENERE' WHERE email = 'admin@sntp.dz';
```

## 📱 Interface

### Vue Publique
- 📂 Navigation dans les dossiers
- 👀 Visualisation des fichiers
- ⬇️ Téléchargement des documents
- 🔍 Fil d'Ariane pour la navigation

### Vue Administrateur
- ➕ Création de dossiers
- 📤 Upload de fichiers/dossiers
- ✏️ Renommage de dossiers
- 🗑️ Suppression de dossiers
- 🌳 Vue arborescente hiérarchique

## 🛑 Arrêter l'application

- **Fermez la fenêtre Electron**
- Ou appuyez sur **Ctrl+C** dans le terminal

## 🐛 Problèmes Courants

### "Node.js n'est pas reconnu"

**Solution:** Installez Node.js depuis [nodejs.org](https://nodejs.org/)

### "Port 3001 déjà utilisé"

**Solution:** Un autre programme utilise le port. Modifiez le port dans `server/server.js`:

```javascript
const PORT = 3002; // Changez ici
```

### "Impossible d'installer les dépendances"

**Solutions:**
1. Vérifiez votre connexion internet
2. Essayez: `npm cache clean --force`
3. Supprimez `node_modules/` et `package-lock.json`
4. Réessayez: `npm install`

### "L'application ne s'ouvre pas"

**Solutions:**
1. Vérifiez la console pour les erreurs
2. Essayez en mode développement: `npm run dev`
3. Testez le serveur seul: `node server/server.js`

### "Erreur de base de données"

**Solution:** Supprimez `database.sqlite` et relancez (créera une nouvelle DB propre)

## 📦 Compilation en exécutable

### Pour Windows

```bash
npm run build:win
```

L'installateur sera dans `dist/SNTP Document Portal-Setup-1.0.0.exe`

### Pour macOS

```bash
npm run build:mac
```

Le .dmg sera dans `dist/SNTP Document Portal-1.0.0.dmg`

### Pour Linux

```bash
npm run build:linux
```

L'AppImage sera dans `dist/SNTP Document Portal-1.0.0.AppImage`

## 🎨 Personnalisation Rapide

### Changer le nom de l'entreprise

Éditez `public/index.html` et `public/js/app.js`:

Cherchez: `Société Nationale des Travaux Publics`
Remplacez par: `Votre Entreprise`

### Changer les couleurs

Éditez `public/index.html`, section `<style>`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #VOTRE_COULEUR1 0%, #VOTRE_COULEUR2 100%);
}
```

### Changer le logo

Remplacez les fichiers dans `public/assets/`:
- `icon.png` (512x512 pixels minimum)
- `icon.ico` (pour Windows)
- `icon.icns` (pour macOS)

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **README.md** - Installation et utilisation
- **DOCUMENTATION.md** - Documentation technique complète
- **MIGRATION.md** - Migrer depuis l'ancienne version PHP

## 🆘 Besoin d'aide ?

1. Consultez `DOCUMENTATION.md`
2. Vérifiez les logs dans la console
3. Testez avec `node test-app.js`

## ✅ Checklist de Départ

- [ ] Node.js installé (version 18+)
- [ ] Dépendances installées (`npm install`)
- [ ] Application démarrée (`npm start`)
- [ ] Connexion admin réussie
- [ ] Premier dossier créé
- [ ] Premier fichier uploadé
- [ ] Mot de passe admin changé ⚠️

---

**🎉 Félicitations !** Votre application est prête à l'emploi.

Pour compiler en version distribuable, consultez **README.md**.
