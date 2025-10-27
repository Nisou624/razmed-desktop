# Documentation : Permissions et Prévisualisation des Fichiers

## 📋 Vue d'ensemble

Le système gère différemment les fichiers selon leur type :

### Types de fichiers et leurs permissions

| Type | Extension | Prévisualisation | Téléchargement | Détails |
|------|-----------|------------------|----------------|---------|
| **PDF** | .pdf | ✅ Oui | ❌ Non | Vue seule, pas de téléchargement |
| **Word** | .doc, .docx | ✅ Oui | ✅ Oui | Conversion HTML, téléchargeable |
| **Excel** | .xls, .xlsx | ✅ Oui | ✅ Oui | Conversion HTML, téléchargeable |
| **PowerPoint** | .ppt, .pptx | ❌ Non* | ✅ Oui | Téléchargeable uniquement |
| **Images** | .jpg, .png, .gif | ✅ Oui | ✅ Oui | Affichage direct |
| **Texte** | .txt | ✅ Oui | ✅ Oui | Affichage formaté |
| **Archives** | .zip, .rar | ❌ Non | ✅ Oui | Téléchargeable uniquement |

*PowerPoint nécessiterait une bibliothèque supplémentaire pour la conversion

## 🔒 Sécurité PDF

### Protection contre le téléchargement

1. **Blocage au niveau serveur**
   ```javascript
   // Dans server/server.js
   app.use('/uploads', (req, res, next) => {
     const ext = path.extname(filePath).toLowerCase();
     if (ext === '.pdf') {
       return res.status(403).json({
         error: 'Accès direct aux PDF non autorisé'
       });
     }
     next();
   });
   ```

2. **Headers HTTP spéciaux**
   ```javascript
   // Dans server/routes/preview.js
   res.setHeader('Content-Disposition', 'inline'); // Forcer la vue
   res.setHeader('Cache-Control', 'no-cache'); // Pas de cache
   res.setHeader('X-Content-Type-Options', 'nosniff'); // Sécurité
   ```

3. **Désactivation bouton téléchargement**
   - Le bouton de téléchargement est désactivé dans l'interface
   - Un badge "Vue seule" indique la restriction

### Limitations connues

⚠️ **Important** : Un utilisateur technique peut toujours :
- Faire une capture d'écran
- Utiliser "Imprimer en PDF" du navigateur
- Ouvrir les DevTools et accéder au blob

Pour une protection absolue, il faudrait :
- DRM (Digital Rights Management)
- Watermarking dynamique
- Chiffrement côté client
- Solutions commerciales (Adobe Document Cloud, etc.)

## 📄 Conversion des fichiers Office

### Word (.docx, .doc)

**Bibliothèque** : `mammoth`

**Processus** :
1. Lecture du fichier .docx
2. Extraction du contenu XML
3. Conversion en HTML propre
4. Ajout de styles CSS
5. Ajout d'un watermark (optionnel)

**Exemple de code** :
```javascript
const mammoth = require('mammoth');

const result = await mammoth.convertToHtml({ path: filePath });
const html = result.value; // HTML propre
```

**Fonctionnalités supportées** :
- ✅ Texte formaté (gras, italique, souligné)
- ✅ Titres (H1, H2, H3...)
- ✅ Listes à puces et numérotées
- ✅ Tableaux
- ✅ Images intégrées
- ⚠️ Styles complexes (approximatifs)
- ❌ Macros VBA
- ❌ Formulaires

### Excel (.xlsx, .xls)

**Bibliothèque** : `xlsx` (SheetJS)

**Processus** :
1. Lecture du classeur Excel
2. Parcours de toutes les feuilles
3. Conversion en tableaux HTML
4. Formatage avec CSS
5. Affichage par onglets

**Exemple de code** :
```javascript
const xlsx = require('xlsx');

const workbook = xlsx.readFile(filePath);
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const html = xlsx.utils.sheet_to_html(worksheet);
});
```

**Fonctionnalités supportées** :
- ✅ Données de cellules
- ✅ Tableaux multi-feuilles
- ✅ Formatage de base
- ⚠️ Formules (affichage des résultats)
- ❌ Graphiques
- ❌ Macros
- ❌ Mise en forme conditionnelle complexe

## 🎨 Personnalisation de la prévisualisation

### Modifier le watermark

Dans `server/routes/preview.js`, cherchez :

```javascript
<div class="watermark">SNTP</div>
```

Remplacez "SNTP" par votre texte ou supprimez la ligne.

### Modifier les couleurs

Dans les styles CSS de chaque fonction de prévisualisation :

```css
.document-header {
  border-bottom: 2px solid #667eea; /* Votre couleur */
}

.sheet-title {
  background: #667eea; /* Votre couleur */
}
```

### Ajouter un logo

Dans le HTML de prévisualisation :

```html
<div class="document-header">
  <img src="/assets/logo.png" alt="Logo" style="height: 50px;">
  <h1 class="document-title">${file.filename}</h1>
</div>
```

## 🔧 Ajout de nouveaux types de fichiers

### Ajouter la prévisualisation PowerPoint

1. **Installer une bibliothèque** :
```bash
npm install pptx2html
```

2. **Ajouter le handler dans preview.js** :
```javascript
case '.pptx':
case '.ppt':
  await handlePowerPointPreview(filePath, file, res);
  break;
```

3. **Créer la fonction** :
```javascript
async function handlePowerPointPreview(filePath, file, res) {
  try {
    const pptx2html = require('pptx2html');
    const html = await pptx2html(filePath);
    
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${file.filename}</title>
        <style>
          /* Vos styles */
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    throw new Error('Erreur conversion PowerPoint: ' + error.message);
  }
}
```

### Ajouter un nouveau type personnalisé

Exemple pour les fichiers Markdown (.md) :

```javascript
case '.md':
  await handleMarkdownPreview(filePath, file, res);
  break;
```

```javascript
async function handleMarkdownPreview(filePath, file, res) {
  const marked = require('marked'); // npm install marked
  const content = await fs.readFile(filePath, 'utf8');
  const html = marked.parse(content);
  
  // ... créer fullHtml avec le HTML converti
}
```

## 📊 Gestion des performances

### Fichiers volumineux

**Problème** : Les gros fichiers Excel/Word peuvent être lents à convertir.

**Solutions** :

1. **Limite de taille** :
```javascript
const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10 MB

if (fileSize > MAX_PREVIEW_SIZE) {
  return res.json({
    success: false,
    error: 'Fichier trop volumineux pour prévisualisation'
  });
}
```

2. **Timeout** :
```javascript
const timeout = setTimeout(() => {
  res.status(504).json({ error: 'Timeout de prévisualisation' });
}, 30000); // 30 secondes

try {
  // Conversion...
  clearTimeout(timeout);
} catch (error) {
  clearTimeout(timeout);
  throw error;
}
```

3. **Cache** :
```javascript
const cache = new Map();

const cacheKey = `preview_${fileId}`;
if (cache.has(cacheKey)) {
  return res.send(cache.get(cacheKey));
}

// Conversion...
cache.set(cacheKey, html);
```

## 🐛 Dépannage

### La prévisualisation ne fonctionne pas

**Symptômes** :
- Écran blanc
- Erreur "Impossible de charger"
- Timeout

**Solutions** :

1. **Vérifier les dépendances** :
```bash
npm list mammoth xlsx
```

2. **Vérifier les logs serveur** :
```bash
# Dans la console où le serveur tourne
# Regardez les erreurs
```

3. **Tester la route directement** :
```bash
# Dans le navigateur
http://localhost:3001/api/preview/1
```

4. **Vérifier les permissions fichiers** :
```bash
ls -la uploads/
# Les fichiers doivent être lisibles
```

### PDF ne s'affiche pas

**Cause possible** : Navigateur bloque les PDF inline.

**Solution** : Utiliser PDF.js (bibliothèque Mozilla) :

```html
<iframe src="/pdf.js/web/viewer.html?file=/api/preview/${fileId}"></iframe>
```

### Word/Excel mal formaté

**Cause** : Conversion imparfaite (styles complexes).

**Solutions** :
1. Simplifier le document source
2. Améliorer les styles CSS de prévisualisation
3. Utiliser une bibliothèque commerciale (Aspose, etc.)

### Erreur "heap out of memory"

**Cause** : Fichier trop gros.

**Solution** :
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

## 🔐 Recommandations de sécurité

### Pour les PDF sensibles

1. **Watermarking dynamique** :
   - Ajouter le nom de l'utilisateur sur chaque page
   - Ajouter la date/heure de consultation

2. **Logs d'accès** :
```javascript
// Dans preview.js
const accessLog = {
  fileId: file.id,
  userId: req.session.adminId,
  timestamp: new Date(),
  action: 'preview'
};
// Enregistrer dans DB ou fichier
```

3. **Limitation de temps** :
```javascript
// Générer un token temporaire
const token = generateToken(fileId, 5 * 60 * 1000); // 5 minutes
const url = `/api/preview/${fileId}?token=${token}`;
```

### Pour les documents Office

1. **Scan antivirus** :
```javascript
const clamav = require('clamav.js');
const scanResult = await clamav.scan(filePath);
if (scanResult.isInfected) {
  throw new Error('Fichier infecté détecté');
}
```

2. **Validation du contenu** :
```javascript
// Vérifier qu'il n'y a pas de macros dangereuses
const hasVBA = checkForVBA(filePath);
if (hasVBA) {
  return res.json({
    error: 'Fichier contient des macros (non autorisé)'
  });
}
```

## 📝 Checklist d'implémentation

- [x] Installation des dépendances (mammoth, xlsx)
- [x] Création de server/routes/preview.js
- [x] Mise à jour de server/server.js
- [x] Blocage accès direct aux PDF
- [x] Mise à jour de l'interface (app.js)
- [x] Fonction openFilePreview()
- [x] Modale de prévisualisation
- [x] Badges de permissions
- [x] Tests de tous les types de fichiers
- [ ] Personnalisation des watermarks
- [ ] Ajout de logs d'accès (optionnel)
- [ ] Configuration du cache (optionnel)

## 🎯 Prochaines améliorations possibles

1. **Prévisualisation PowerPoint** avec pptx2html
2. **Annotations PDF** avec PDF.js
3. **Comparaison de versions** de documents
4. **Recherche full-text** dans les documents
5. **OCR** pour les images/scans
6. **Conversion automatique** en PDF
7. **Signature électronique** des documents

---

**Support** : Pour toute question, consultez DOCUMENTATION.md ou les logs du serveur.
