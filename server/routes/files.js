const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { run, get, all } = require('../database');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const safeName = basename.replace(/[^a-z0-9\u00C0-\u017F]/gi, '_');
    cb(null, uniqueSuffix + '_' + safeName + ext);
  }
});

// Filtre pour n'accepter que certains types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel'
  ];
  
  const allowedExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.originalname}. Types acceptés: PDF, DOCX, XLSX`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max
  }
});

// Fonction pour déterminer si le téléchargement est autorisé
function isDownloadAllowed(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.docx', '.doc', '.xlsx', '.xls'].includes(ext);
}

// GET /api/files - Récupérer tous les fichiers
router.get('/', async (req, res) => {
  try {
    const files = await all('SELECT * FROM files ORDER BY uploaded_at DESC');
    res.json({ success: true, files });
  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des fichiers'
    });
  }
});

// GET /api/files/:id - Récupérer un fichier spécifique
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

    res.json({ success: true, file });

  } catch (error) {
    console.error('Erreur récupération fichier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du fichier'
    });
  }
});

// POST /api/files/upload - Upload de fichier simple (admin uniquement)
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { folder_id } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    if (!folder_id) {
      return res.status(400).json({
        success: false,
        error: 'ID du dossier requis'
      });
    }

    // Vérifier que le dossier existe
    const folder = await get('SELECT * FROM folders WHERE id = ?', [folder_id]);
    if (!folder) {
      // Supprimer le fichier uploadé
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    const filepath = 'uploads/' + req.file.filename;

    // Enregistrer dans la base de données
    const result = await run(
      'INSERT INTO files (folder_id, filename, filepath) VALUES (?, ?, ?)',
      [folder_id, req.file.originalname, filepath]
    );

    const file = await get('SELECT * FROM files WHERE id = ?', [result.id]);

    res.json({
      success: true,
      file
    });

  } catch (error) {
    console.error('Erreur upload fichier:', error);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur suppression fichier:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload du fichier'
    });
  }
});

// POST /api/files/upload-folder - Upload d'un dossier complet avec structure (admin uniquement)
router.post('/upload-folder', isAuthenticated, upload.array('files', 1000), async (req, res) => {
  try {
    const { folderStructure } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const structure = JSON.parse(folderStructure);
    const uploadedFiles = [];
    const errors = [];

    console.log(`Traitement de ${req.files.length} fichiers...`);

    // Créer les dossiers et uploader les fichiers
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileInfo = structure[i];

      try {
        // Créer la hiérarchie de dossiers si nécessaire
        let currentParentId = null;

        // Parcourir chaque niveau de dossier dans la hiérarchie
        for (const folderName of fileInfo.folders) {
          if (folderName.trim() === '') continue; // Ignorer les dossiers vides

          // Chercher si le dossier existe déjà à ce niveau
          const existingFolder = await get(
            'SELECT id FROM folders WHERE name = ? AND (parent_id IS ? OR parent_id = ?)',
            [folderName, currentParentId, currentParentId]
          );

          if (existingFolder) {
            currentParentId = existingFolder.id;
          } else {
            // Créer le nouveau dossier
            const result = await run(
              'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
              [folderName, currentParentId]
            );
            currentParentId = result.id;
            console.log(`Dossier créé: ${folderName} (ID: ${currentParentId})`);
          }
        }

        // Si pas de structure de dossier, utiliser le dossier racine par défaut
        if (!currentParentId && fileInfo.folders.length === 0) {
          // Créer un dossier "Uploads" par défaut si nécessaire
          let defaultFolder = await get('SELECT id FROM folders WHERE name = ? AND parent_id IS NULL', ['Uploads']);
          if (!defaultFolder) {
            const result = await run('INSERT INTO folders (name, parent_id) VALUES (?, ?)', ['Uploads', null]);
            defaultFolder = { id: result.id };
          }
          currentParentId = defaultFolder.id;
        }

        // Enregistrer le fichier
        const filepath = 'uploads/' + file.filename;
        const result = await run(
          'INSERT INTO files (folder_id, filename, filepath) VALUES (?, ?, ?)',
          [currentParentId, file.originalname, filepath]
        );

        uploadedFiles.push({
          id: result.id,
          filename: file.originalname,
          folder_path: fileInfo.folders.join('/'),
          folder_id: currentParentId
        });

        console.log(`Fichier uploadé: ${file.originalname} dans dossier ID ${currentParentId}`);

      } catch (error) {
        console.error('Erreur traitement fichier:', file.originalname, error);
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        
        // Supprimer le fichier en cas d'erreur
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkError) {
          console.error('Erreur suppression fichier en erreur:', unlinkError);
        }
      }
    }

    console.log(`Upload terminé: ${uploadedFiles.length} fichiers uploadés, ${errors.length} erreurs`);

    res.json({
      success: true,
      uploaded: uploadedFiles.length,
      errors: errors.length,
      details: {
        uploadedFiles,
        errors
      }
    });

  } catch (error) {
    console.error('Erreur upload dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload du dossier'
    });
  }
});

// GET /api/files/:id/download - Télécharger un fichier (avec restrictions)
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Fichier introuvable'
      });
    }

    // Vérifier si le téléchargement est autorisé pour ce type de fichier
    if (!isDownloadAllowed(file.filename)) {
      return res.status(403).json({
        success: false,
        error: 'Téléchargement non autorisé pour ce type de fichier. Seuls les fichiers DOCX et XLSX peuvent être téléchargés.'
      });
    }

    const filePath = path.join(__dirname, '..', '..', file.filepath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier physique introuvable'
      });
    }

    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Envoyer le fichier
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Erreur lecture fichier:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la lecture du fichier'
      });
    });

  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
});

// DELETE /api/files/:id - Supprimer un fichier (admin uniquement)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le fichier
    const file = await get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Fichier introuvable'
      });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', '..', file.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer de la base de données
    await run('DELETE FROM files WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du fichier'
    });
  }
});

module.exports = router;

