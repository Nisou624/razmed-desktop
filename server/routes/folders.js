const express = require('express');
const { run, get, all } = require('../database');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// GET /api/folders - Récupérer tous les dossiers
router.get('/', async (req, res) => {
  try {
    const folders = await all('SELECT * FROM folders ORDER BY name ASC');
    res.json({ success: true, folders });
  } catch (error) {
    console.error('Erreur récupération dossiers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dossiers'
    });
  }
});

// GET /api/folders/:id - Récupérer un dossier spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    // Récupérer les sous-dossiers
    const subfolders = await all(
      'SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC',
      [id]
    );

    // Récupérer les fichiers
    const files = await all(
      'SELECT * FROM files WHERE folder_id = ? ORDER BY uploaded_at DESC',
      [id]
    );

    res.json({
      success: true,
      folder,
      subfolders,
      files
    });

  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du dossier'
    });
  }
});

// POST /api/folders - Créer un nouveau dossier (admin uniquement)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le nom du dossier est requis'
      });
    }

    const result = await run(
      'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
      [name.trim(), parent_id || null]
    );

    const folder = await get('SELECT * FROM folders WHERE id = ?', [result.id]);

    res.json({
      success: true,
      folder
    });

  } catch (error) {
    console.error('Erreur création dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du dossier'
    });
  }
});

// PUT /api/folders/:id - Modifier un dossier (admin uniquement)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le nom du dossier est requis'
      });
    }

    await run(
      'UPDATE folders SET name = ? WHERE id = ?',
      [name.trim(), id]
    );

    const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);

    res.json({
      success: true,
      folder
    });

  } catch (error) {
    console.error('Erreur modification dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du dossier'
    });
  }
});

// DELETE /api/folders/:id - Supprimer un dossier (admin uniquement)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le dossier existe
    const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    // Supprimer le dossier (CASCADE supprimera les fichiers)
    await run('DELETE FROM folders WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Dossier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du dossier'
    });
  }
});

// GET /api/folders/:id/path - Récupérer le chemin complet d'un dossier (breadcrumb)
router.get('/:id/path', async (req, res) => {
  try {
    const { id } = req.params;
    const path = [];
    let currentId = id;

    while (currentId) {
      const folder = await get('SELECT * FROM folders WHERE id = ?', [currentId]);
      
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parent_id;
    }

    res.json({
      success: true,
      path
    });

  } catch (error) {
    console.error('Erreur récupération chemin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du chemin'
    });
  }
});

// GET /api/folders/:id/count - Compter les fichiers dans un dossier et ses sous-dossiers
router.get('/:id/count', async (req, res) => {
  try {
    const { id } = req.params;

    async function countFiles(folderId) {
      // Compter les fichiers directs
      const directFiles = await get(
        'SELECT COUNT(*) as count FROM files WHERE folder_id = ?',
        [folderId]
      );
      
      let total = directFiles.count;

      // Compter les fichiers dans les sous-dossiers
      const subfolders = await all(
        'SELECT id FROM folders WHERE parent_id = ?',
        [folderId]
      );

      for (const subfolder of subfolders) {
        total += await countFiles(subfolder.id);
      }

      return total;
    }

    const count = await countFiles(id);

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Erreur comptage fichiers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du comptage des fichiers'
    });
  }
});

module.exports = router;
