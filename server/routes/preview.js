const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { get } = require('../database');

const router = express.Router();

// GET /api/preview/:id - Prévisualiser un fichier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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

    const ext = path.extname(file.filename).toLowerCase();

    switch (ext) {
      case '.pdf':
        // Pour les PDF, envoyer directement le fichier
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        const pdfStream = fs.createReadStream(filePath);
        pdfStream.pipe(res);
        break;

      case '.docx':
      case '.doc':
        // Pour les documents Word, générer un aperçu HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>Prévisualisation - ${file.filename}</title>
              <style>
                  body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      margin: 20px;
                      background-color: #f8f9fa;
                  }
                  .preview-container {
                      background: white;
                      padding: 40px;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      text-align: center;
                  }
                  .document-icon {
                      font-size: 4rem;
                      color: #0066cc;
                      margin-bottom: 20px;
                  }
                  .document-info {
                      color: #6c757d;
                      margin-top: 15px;
                  }
                  .download-btn {
                      background: #0066cc;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 6px;
                      text-decoration: none;
                      display: inline-block;
                      margin-top: 20px;
                      font-weight: 600;
                  }
                  .download-btn:hover {
                      background: #0056b3;
                      color: white;
                  }
              </style>
          </head>
          <body>
              <div class="preview-container">
                  <div class="document-icon">📄</div>
                  <h2>Document Word</h2>
                  <p><strong>${file.filename}</strong></p>
                  <p class="document-info">
                      La prévisualisation complète des documents Word n'est pas disponible dans le navigateur.<br>
                      Téléchargez le fichier pour le consulter avec Microsoft Word ou un autre éditeur compatible.
                  </p>
                  <a href="/api/files/${id}/download" class="download-btn">
                      📥 Télécharger le document
                  </a>
              </div>
          </body>
          </html>
        `);
        break;

      case '.xlsx':
      case '.xls':
        // Pour les feuilles Excel, générer un aperçu HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>Prévisualisation - ${file.filename}</title>
              <style>
                  body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      margin: 20px;
                      background-color: #f8f9fa;
                  }
                  .preview-container {
                      background: white;
                      padding: 40px;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      text-align: center;
                  }
                  .document-icon {
                      font-size: 4rem;
                      color: #217346;
                      margin-bottom: 20px;
                  }
                  .document-info {
                      color: #6c757d;
                      margin-top: 15px;
                  }
                  .download-btn {
                      background: #217346;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 6px;
                      text-decoration: none;
                      display: inline-block;
                      margin-top: 20px;
                      font-weight: 600;
                  }
                  .download-btn:hover {
                      background: #1e6540;
                      color: white;
                  }
              </style>
          </head>
          <body>
              <div class="preview-container">
                  <div class="document-icon">📊</div>
                  <h2>Feuille de calcul Excel</h2>
                  <p><strong>${file.filename}</strong></p>
                  <p class="document-info">
                      La prévisualisation complète des feuilles de calcul Excel n'est pas disponible dans le navigateur.<br>
                      Téléchargez le fichier pour le consulter avec Microsoft Excel ou un autre tableur compatible.
                  </p>
                  <a href="/api/files/${id}/download" class="download-btn">
                      📥 Télécharger la feuille de calcul
                  </a>
              </div>
          </body>
          </html>
        `);
        break;

      default:
        // Pour les autres types de fichiers
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>Prévisualisation - ${file.filename}</title>
              <style>
                  body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      margin: 20px;
                      background-color: #f8f9fa;
                  }
                  .preview-container {
                      background: white;
                      padding: 40px;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      text-align: center;
                  }
                  .document-icon {
                      font-size: 4rem;
                      color: #6c757d;
                      margin-bottom: 20px;
                  }
                  .document-info {
                      color: #6c757d;
                      margin-top: 15px;
                  }
              </style>
          </head>
          <body>
              <div class="preview-container">
                  <div class="document-icon">📄</div>
                  <h2>Prévisualisation non disponible</h2>
                  <p><strong>${file.filename}</strong></p>
                  <p class="document-info">
                      Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
                  </p>
              </div>
          </body>
          </html>
        `);
    }

  } catch (error) {
    console.error('Erreur prévisualisation fichier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la prévisualisation du fichier'
    });
  }
});

module.exports = router;

