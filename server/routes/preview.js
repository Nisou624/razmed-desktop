const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { get } = require('../database');

const router = express.Router();

// GET /api/preview/:id - Prévisualiser un fichier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le fichier de la base de données
    const file = await get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Fichier introuvable'
      });
    }

    const filePath = path.join(__dirname, '..', '..', file.filepath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier physique introuvable'
      });
    }

    // Déterminer l'extension
    const ext = path.extname(file.filename).toLowerCase();

    // Traitement selon le type de fichier
    switch (ext) {
      case '.pdf':
        await handlePdfPreview(filePath, file, res);
        break;

      case '.docx':
      case '.doc':
        await handleWordPreview(filePath, file, res);
        break;

      case '.xlsx':
      case '.xls':
        await handleExcelPreview(filePath, file, res);
        break;

      case '.txt':
        await handleTextPreview(filePath, file, res);
        break;

      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.webp':
        await handleImagePreview(filePath, file, res);
        break;

      default:
        res.status(400).json({
          success: false,
          error: 'Type de fichier non supporté pour la prévisualisation'
        });
    }

  } catch (error) {
    console.error('Erreur prévisualisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la prévisualisation',
      details: error.message
    });
  }
});

// Prévisualisation PDF - Retourne le fichier avec headers spéciaux
async function handlePdfPreview(filePath, file, res) {
  try {
    // Lire le fichier PDF
    const pdfBuffer = await fs.readFile(filePath);

    // Headers pour empêcher le téléchargement et forcer l'affichage
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Empêcher le téléchargement via JavaScript
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    res.send(pdfBuffer);
  } catch (error) {
    throw new Error('Erreur lecture PDF: ' + error.message);
  }
}

// Prévisualisation Word - Convertir en HTML
async function handleWordPreview(filePath, file, res) {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    const html = result.value;
    const messages = result.messages;

    // Créer une page HTML complète
    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.filename}</title>
    <style>
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .document-container {
            background: white;
            padding: 60px 80px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 100vh;
        }
        .document-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        .document-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .document-content {
            color: #333;
        }
        .document-content p {
            margin: 1em 0;
        }
        .document-content h1, .document-content h2, .document-content h3 {
            color: #667eea;
            margin-top: 1.5em;
        }
        .document-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        .document-content table td, .document-content table th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        .document-content table th {
            background-color: #667eea;
            color: white;
        }
        .document-content img {
            max-width: 100%;
            height: auto;
        }
        .document-content ul, .document-content ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 1;
            white-space: nowrap;
        }
        @media print {
            .watermark { display: none; }
        }
    </style>
</head>
<body>
    <div class="watermark">SNTP</div>
    <div class="document-container">
        <div class="document-header">
            <h1 class="document-title">${file.filename}</h1>
        </div>
        <div class="document-content">
            ${html}
        </div>
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    throw new Error('Erreur conversion Word: ' + error.message);
  }
}

// Prévisualisation Excel - Convertir en HTML tableau
async function handleExcelPreview(filePath, file, res) {
  try {
    const workbook = xlsx.readFile(filePath);
    
    let htmlContent = '';
    
    // Parcourir toutes les feuilles
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en HTML
      const htmlTable = xlsx.utils.sheet_to_html(worksheet, {
        header: '',
        footer: ''
      });
      
      htmlContent += `
        <div class="sheet-container">
          <h2 class="sheet-title">Feuille: ${sheetName}</h2>
          ${htmlTable}
        </div>
      `;
    });

    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.filename}</title>
    <style>
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .file-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        .file-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .sheet-container {
            margin-bottom: 40px;
        }
        .sheet-title {
            background: #667eea;
            color: white;
            padding: 10px 15px;
            margin: 20px 0 10px 0;
            border-radius: 4px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
            font-size: 0.9rem;
        }
        table td, table th {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        table tr:hover {
            background-color: #e9ecef;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: -1;
            white-space: nowrap;
        }
        @media print {
            .watermark { display: none; }
        }
    </style>
</head>
<body>
    <div class="watermark">SNTP</div>
    <div class="container">
        <div class="file-header">
            <h1 class="file-title">${file.filename}</h1>
        </div>
        ${htmlContent}
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    throw new Error('Erreur conversion Excel: ' + error.message);
  }
}

// Prévisualisation Texte
async function handleTextPreview(filePath, file, res) {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.filename}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .text-container {
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 100vh;
        }
        .text-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
        }
        .text-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .text-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #333;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="text-container">
        <div class="text-header">
            <h1 class="text-title">${file.filename}</h1>
        </div>
        <pre class="text-content">${content}</pre>
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    throw new Error('Erreur lecture texte: ' + error.message);
  }
}

// Prévisualisation Image
async function handleImagePreview(filePath, file, res) {
  try {
    const imageBuffer = await fs.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(file.filename).toLowerCase().substring(1);
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.filename}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .image-container {
            background: white;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            max-width: 90%;
            text-align: center;
        }
        .image-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #667eea;
        }
        .image-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        .image-preview {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="image-container">
        <div class="image-header">
            <h1 class="image-title">${file.filename}</h1>
        </div>
        <img src="data:${mimeType};base64,${base64Image}" alt="${file.filename}" class="image-preview">
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    throw new Error('Erreur lecture image: ' + error.message);
  }
}

module.exports = router;
