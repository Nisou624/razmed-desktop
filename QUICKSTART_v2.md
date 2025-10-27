# 🚀 Guide de Démarrage Rapide v2 - Avec Prévisualisation

## ⚡ Installation en 3 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer l'application

```bash
npm start
```

### 3. Se connecter

- Email: `admin@sntp.dz`
- Mot de passe: `admin`

## 📄 Utilisation du système de prévisualisation

### Uploader des fichiers

1. **Connectez-vous** comme admin
2. **Créez un dossier** ou ouvrez-en un existant
3. **Glissez-déposez** vos fichiers (ou cliquez pour sélectionner)

### Types de fichiers supportés

| Fichier | Prévisualisation | Téléchargement | Action |
|---------|------------------|----------------|--------|
| 📕 PDF | ✅ Oui | ❌ Non | Vue seule protégée |
| 📘 Word | ✅ Oui | ✅ Oui | Conversion HTML |
| 📗 Excel | ✅ Oui | ✅ Oui | Tableaux interactifs |
| 🖼️ Images | ✅ Oui | ✅ Oui | Affichage direct |
| 📝 Texte | ✅ Oui | ✅ Oui | Formaté |

### Prévisualiser un document

#### Méthode 1 : Depuis la liste
1. Ouvrez un dossier
2. Cliquez sur **"Prévisualiser"** à côté du fichier
3. Le document s'ouvre en plein écran

#### Méthode 2 : Clavier
- Appuyez sur **Echap** pour fermer la prévisualisation

### Télécharger un document

1. **PDF** : Téléchargement bloqué (vue seule)
2. **Autres types** : Cliquez sur **"Télécharger"**

## 🔒 Comprendre les permissions

### Badge "Vue seule" (rouge)
- Fichier **PDF uniquement**
- Visualisable mais **pas téléchargeable**
- Protégé au niveau serveur

### Badge "Téléchargeable" (vert)
- Fichiers **Word, Excel, etc.**
- Visualisable **ET** téléchargeable
- Accès complet

### Pas de badge
- Fichier **non prévisualisable**
- Archives, exécutables, etc.
- Téléchargement uniquement

## 🎯 Cas d'usage courants

### Cas 1 : Partager un rapport confidentiel (PDF)

**Besoin** : Les utilisateurs doivent lire mais pas télécharger

**Solution** :
1. Convertissez votre rapport en **PDF**
2. Uploadez-le dans l'application
3. Les utilisateurs peuvent le **lire** mais **pas** le télécharger

**Sécurité** :
- ✅ Accès direct bloqué
- ✅ Bouton téléchargement désactivé
- ⚠️ Capture d'écran possible

### Cas 2 : Partager un document Word modifiable

**Besoin** : Les utilisateurs doivent pouvoir télécharger et modifier

**Solution** :
1. Uploadez votre fichier **.docx**
2. Les utilisateurs peuvent :
   - **Prévisualiser** (conversion HTML)
   - **Télécharger** l'original
   - Modifier avec Word

### Cas 3 : Partager des tableaux Excel

**Besoin** : Consultation de données sans téléchargement massif

**Solution** :
1. Uploadez votre fichier **.xlsx**
2. Les utilisateurs peuvent :
   - **Prévisualiser** tous les onglets
   - **Télécharger** si nécessaire
   - Voir les données formatées

## 🧪 Tester les fonctionnalités

### Test rapide des permissions

```bash
node test-permissions.js
```

Ce script vérifie :
- ✅ Serveur accessible
- ✅ PDF bloqué en accès direct
- ✅ Word/Excel accessible
- ✅ Route de prévisualisation fonctionnelle
- ✅ Dépendances installées

### Test manuel

1. **Uploader un PDF** :
   - Cliquez sur "Prévisualiser" → ✅ S'ouvre
   - Cliquez sur "Télécharger" → ❌ Bouton grisé

2. **Uploader un Word** :
   - Cliquez sur "Prévisualiser" → ✅ Conversion HTML
   - Cliquez sur "Télécharger" → ✅ Téléchargement OK

3. **Accès direct** :
   - Tentez `http://localhost:3001/uploads/fichier.pdf`
   - → ❌ Erreur 403 (Accès refusé)

## 🎨 Personnalisation rapide

### Changer le watermark

Éditez `server/routes/preview.js` :

```javascript
// Ligne ~100-110
<div class="watermark">VOTRE_TEXTE</div>
```

### Changer les couleurs

Éditez `server/routes/preview.js` :

```javascript
// Dans les styles CSS
background: #VOTRE_COULEUR;
```

### Ajouter votre logo

```javascript
// Dans le HTML de prévisualisation
<img src="/assets/votre-logo.png" style="height: 50px;">
```

## ⚠️ Limitations connues

### Protection PDF

**Ce qui est protégé** :
- ✅ Téléchargement direct
- ✅ Accès URL direct
- ✅ Click-droit "Enregistrer sous"

**Ce qui n'est PAS protégé** :
- ❌ Capture d'écran
- ❌ "Imprimer en PDF" du navigateur
- ❌ DevTools (utilisateurs avancés)

**Pour une protection absolue** :
- Utilisez un service DRM commercial
- Adobe Document Cloud
- Microsoft Azure Information Protection

### Conversion Office

**Word** :
- ✅ Texte et images
- ✅ Tableaux simples
- ⚠️ Styles complexes (approximatifs)
- ❌ Macros VBA

**Excel** :
- ✅ Données de cellules
- ✅ Multi-feuilles
- ⚠️ Formules (résultats affichés)
- ❌ Graphiques
- ❌ Macros

## 🔧 Résolution de problèmes

### La prévisualisation ne s'ouvre pas

**Causes possibles** :
1. Dépendances manquantes
2. Fichier corrompu
3. Type non supporté

**Solutions** :
```bash
# 1. Vérifier les dépendances
npm list mammoth xlsx pdf-lib

# 2. Réinstaller si nécessaire
npm install mammoth xlsx pdf-lib

# 3. Tester
node test-permissions.js
```

### PDF s'affiche en blanc

**Cause** : Navigateur bloque les iframes

**Solution** :
1. Vérifiez les logs du serveur
2. Testez directement : `http://localhost:3001/api/preview/ID`
3. Changez de navigateur si nécessaire

### Word mal formaté

**Cause** : Styles complexes du document

**Solutions** :
1. Simplifiez le document source
2. Utilisez des styles standards
3. Supprimez les éléments complexes (graphiques SmartArt, etc.)

### Téléchargement lent

**Cause** : Fichiers volumineux

**Solutions** :
1. Limitez la taille des fichiers uploadés
2. Compressez les images dans les documents
3. Divisez les gros fichiers en plusieurs parties

## 📊 Métriques de performance

**Temps de prévisualisation moyen** :
- PDF (10 MB) : ~1-2 secondes
- Word (5 MB) : ~2-3 secondes
- Excel (3 MB) : ~3-4 secondes
- Image (2 MB) : < 1 seconde

**Taille maximale recommandée** :
- PDF : 50 MB
- Word : 20 MB
- Excel : 10 MB
- Images : 10 MB

## 🎓 Bonnes pratiques

### Pour les administrateurs

1. **Nommez les fichiers clairement**
   - ✅ `Rapport_Annuel_2024.pdf`
   - ❌ `document1.pdf`

2. **Organisez par dossiers**
   - Année → Mois → Type de document

3. **Limitez les permissions**
   - PDF pour documents sensibles
   - Word/Excel pour documents collaboratifs

### Pour les utilisateurs

1. **Utilisez la prévisualisation**
   - Évite les téléchargements inutiles
   - Plus rapide

2. **Respectez les permissions**
   - Ne cherchez pas à contourner les restrictions
   - Les accès sont loggés

3. **Signalez les problèmes**
   - Document mal formaté
   - Prévisualisation cassée

## 📚 Documentation complète

- **README.md** - Guide complet
- **FILE_PERMISSIONS.md** - Détails techniques des permissions
- **DOCUMENTATION.md** - Documentation développeur
- **MIGRATION.md** - Migration depuis PHP

## ✅ Checklist de démarrage

- [ ] Node.js installé (v18+)
- [ ] Dépendances installées (`npm install`)
- [ ] Application démarrée (`npm start`)
- [ ] Connexion admin réussie
- [ ] Premier dossier créé
- [ ] PDF uploadé et testé (vue seule)
- [ ] Word uploadé et testé (téléchargeable)
- [ ] Excel uploadé et testé (multi-feuilles)
- [ ] Tests exécutés (`node test-permissions.js`)
- [ ] Mot de passe admin changé ⚠️

## 🆘 Support rapide

**Problème** : Serveur ne démarre pas  
**Solution** : `npm install && npm start`

**Problème** : Prévisualisation ne fonctionne pas  
**Solution** : `node test-permissions.js`

**Problème** : PDF téléchargeable  
**Solution** : Vérifiez que la route `/uploads` bloque bien les PDF

**Problème** : Word mal affiché  
**Solution** : Simplifiez le document ou consultez `FILE_PERMISSIONS.md`

---

**🎉 Vous êtes prêt !** Commencez à uploader vos documents et profitez de la prévisualisation avancée.

Pour aller plus loin, consultez **FILE_PERMISSIONS.md** pour personnaliser le système.
