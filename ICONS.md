# Guide de création des icônes

Pour que l'application ait des icônes professionnelles, vous devez créer les icônes dans les formats appropriés.

## 📁 Structure des icônes

```
public/assets/
├── icon.png       # 512x512 pixels (Linux)
├── icon.ico       # Multi-résolutions (Windows)
└── icon.icns      # Multi-résolutions (macOS)
```

## 🎨 Créer les icônes

### Option 1: Utiliser un service en ligne

**Electron Icon Maker** (Recommandé)
1. Allez sur https://www.electronforge.io/
2. Ou utilisez https://icoconvert.com/

**Étapes:**
1. Créez une image PNG de 1024x1024 pixels avec votre logo
2. Uploadez-la sur le service
3. Téléchargez les fichiers `.ico`, `.icns`, et `.png`
4. Placez-les dans `public/assets/`

### Option 2: Utiliser Photoshop/GIMP

1. Créez votre logo en 1024x1024 pixels
2. Sauvegardez en PNG (icon.png)
3. Utilisez des outils de conversion:

**Pour Windows (.ico):**
```bash
# Installer ImageMagick
sudo apt-get install imagemagick  # Linux
brew install imagemagick          # macOS

# Convertir
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

**Pour macOS (.icns):**
```bash
# Créer un iconset
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Créer le fichier .icns
iconutil -c icns icon.iconset
```

### Option 3: Utiliser electron-icon-builder

```bash
# Installer
npm install -g electron-icon-builder

# Créer les icônes à partir d'un PNG
electron-icon-builder --input=./logo.png --output=./public/assets/
```

## 📐 Spécifications des icônes

### Windows (.ico)
- Formats inclus: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Transparence: Supportée
- Format: ICO

### macOS (.icns)
- Formats inclus: 16x16 à 1024x1024 (@1x et @2x)
- Transparence: Supportée
- Format: ICNS

### Linux (.png)
- Taille: 512x512 pixels minimum
- Transparence: Supportée
- Format: PNG

## 🎨 Recommandations de design

### Couleurs
- Utilisez les couleurs de la marque SNTP
- Évitez trop de détails (l'icône sera petite)
- Utilisez un fond transparent

### Style
- Simple et reconnaissable
- Contraste élevé
- Évitez les dégradés complexes
- Testez en petit format (16x16)

### Exemple de logo pour SNTP

```
┌─────────────────┐
│                 │
│    ╔═══════╗    │  Dossier stylisé
│    ║  SNTP ║    │  avec acronyme
│    ╚═══════╝    │
│                 │
└─────────────────┘
```

## 🔧 Créer un logo temporaire

Si vous n'avez pas encore de logo, créez un logo temporaire avec Node.js:

```javascript
// create-icon.js
const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Fond dégradé
const gradient = ctx.createLinearGradient(0, 0, size, size);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, size, size);

// Icône dossier blanc
ctx.fillStyle = 'white';
ctx.font = 'bold 200px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('📁', size/2, size/2 - 50);

// Texte SNTP
ctx.font = 'bold 120px Arial';
ctx.fillText('SNTP', size/2, size/2 + 150);

// Sauvegarder
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./public/assets/icon.png', buffer);

console.log('✅ Icône créée: public/assets/icon.png');
```

Installez canvas:
```bash
npm install canvas
```

Exécutez:
```bash
node create-icon.js
```

## ✅ Vérifier les icônes

Après avoir créé vos icônes:

1. **Vérifier la taille des fichiers:**
```bash
ls -lh public/assets/
```

2. **Vérifier la structure:**
```bash
file public/assets/*
```

3. **Tester dans l'application:**
```bash
npm start
```

L'icône devrait apparaître dans:
- La barre des tâches
- La fenêtre de l'application
- Le menu Alt+Tab
- L'installateur

## 📝 Notes importantes

- Les icônes doivent être créées **avant** de compiler l'application
- Si vous modifiez les icônes, recompilez l'application
- Gardez le fichier PNG source en haute résolution (1024x1024 minimum)
- Testez les icônes sur différentes résolutions d'écran

## 🆘 Problèmes courants

**L'icône n'apparaît pas:**
- Vérifiez que le chemin dans `package.json` est correct
- Vérifiez que les fichiers existent
- Reconstruisez l'application

**L'icône est floue:**
- Utilisez une résolution plus élevée pour le fichier source
- Assurez-vous que l'icône contient toutes les tailles nécessaires

**Erreur de build:**
- Vérifiez que tous les formats d'icônes sont présents
- Vérifiez les permissions des fichiers
