const express = require('express');
const { run, get, all } = require('../database');
const { isAuthenticated } = require('./auth');

const router = express.Router();

// GET /api/folders - Récupérer tous les dossiers
router.get('/', async (req, res) => {
  try {
    const folders = await all(`
      SELECT f.*, 
             (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count
      FROM folders f 
      ORDER BY f.name ASC
    `);
    
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
    const folder = await get(`
      SELECT f.*, 
             (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count
      FROM folders f 
      WHERE f.id = ?
    `, [id]);

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du dossier'
    });
  }
});

// GET /api/folders/:id/files - Récupérer les fichiers d'un dossier
router.get('/:id/files', async (req, res) => {
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

    // Récupérer les fichiers du dossier
    const files = await all(`
      SELECT * FROM files 
      WHERE folder_id = ? 
      ORDER BY filename ASC
    `, [id]);

    res.json({ 
      success: true, 
      files,
      folder: folder
    });

  } catch (error) {
    console.error('Erreur récupération fichiers du dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des fichiers du dossier'
    });
  }
});

// POST /api/folders - Créer un nouveau dossier (admin uniquement)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le nom du dossier est requis'
      });
    }

    // Vérifier que le nom n'est pas déjà utilisé au même niveau
    const existingFolder = await get(
      'SELECT id FROM folders WHERE name = ? AND (parent_id IS ? OR parent_id = ?)',
      [name.trim(), parent_id || null, parent_id || null]
    );

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        error: 'Un dossier avec ce nom existe déjà'
      });
    }

    // Si parent_id est fourni, vérifier qu'il existe
    if (parent_id) {
      const parentFolder = await get('SELECT id FROM folders WHERE id = ?', [parent_id]);
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          error: 'Dossier parent introuvable'
        });
      }
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

// PUT /api/folders/:id - Mettre à jour un dossier (admin uniquement)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    console.log(`Tentative de mise à jour du dossier ${id} avec le nom: ${name}`);

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le nom du dossier est requis'
      });
    }

    // Vérifier que le dossier existe
    const existingFolder = await get('SELECT * FROM folders WHERE id = ?', [id]);
    if (!existingFolder) {
      console.log(`Dossier ${id} introuvable`);
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    // Vérifier que le nouveau nom n'est pas déjà utilisé au même niveau (sauf pour le dossier actuel)
    const duplicateFolder = await get(
      'SELECT id FROM folders WHERE name = ? AND (parent_id IS ? OR parent_id = ?) AND id != ?',
      [name.trim(), parent_id || null, parent_id || null, id]
    );

    if (duplicateFolder) {
      return res.status(400).json({
        success: false,
        error: 'Un dossier avec ce nom existe déjà'
      });
    }

    await run(
      'UPDATE folders SET name = ?, parent_id = ? WHERE id = ?',
      [name.trim(), parent_id || null, id]
    );

    const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);

    console.log(`Dossier ${id} mis à jour avec succès`);

    res.json({
      success: true,
      folder
    });

  } catch (error) {
    console.error('Erreur mise à jour dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du dossier'
    });
  }
});

// DELETE /api/folders/:id - Supprimer un dossier (admin uniquement) - VERSION CORRIGÉE
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Tentative de suppression du dossier ${id}`);

    // Vérifier que le dossier existe
    const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      console.log(`Dossier ${id} introuvable`);
      return res.status(404).json({
        success: false,
        error: 'Dossier introuvable'
      });
    }

    console.log(`Dossier trouvé: ${folder.name}`);

    // Vérifier s'il y a des fichiers dans le dossier
    const filesCount = await get('SELECT COUNT(*) as count FROM files WHERE folder_id = ?', [id]);
    console.log(`Nombre de fichiers dans le dossier: ${filesCount.count}`);

    // Vérifier s'il y a des sous-dossiers
    const subFoldersCount = await get('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?', [id]);
    console.log(`Nombre de sous-dossiers: ${subFoldersCount.count}`);

    // Permettre la suppression même si le dossier contient des fichiers/sous-dossiers
    // Mais avertir l'utilisateur

    if (filesCount.count > 0 || subFoldersCount.count > 0) {
      // Option 1: Interdire la suppression (comportement actuel)
      /*
      return res.status(400).json({
        success: false,
        error: `Impossible de supprimer le dossier "${folder.name}". Il contient ${filesCount.count} fichier(s) et ${subFoldersCount.count} sous-dossier(s).`
      });
      */

      // Option 2: Permettre la suppression avec cascade (nouveau comportement)
      console.log(`Suppression en cascade du dossier ${folder.name} et de son contenu...`);
      
      // Supprimer tous les fichiers du dossier
      if (filesCount.count > 0) {
        console.log(`Suppression de ${filesCount.count} fichiers...`);
        await run('DELETE FROM files WHERE folder_id = ?', [id]);
      }

      // Supprimer tous les sous-dossiers récursivement
      if (subFoldersCount.count > 0) {
        console.log(`Suppression de ${subFoldersCount.count} sous-dossiers...`);
        await deleteFolderRecursive(id);
      }
    }

    // Supprimer le dossier lui-même
    const result = await run('DELETE FROM folders WHERE id = ?', [id]);
    console.log(`Résultat suppression: ${result.changes} ligne(s) supprimée(s)`);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dossier non trouvé ou déjà supprimé'
      });
    }

    console.log(`Dossier ${folder.name} supprimé avec succès`);

    res.json({
      success: true,
      message: `Dossier "${folder.name}" supprimé avec succès`
    });

  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du dossier: ' + error.message
    });
  }
});

// Fonction utilitaire pour supprimer un dossier récursivement
async function deleteFolderRecursive(folderId) {
  try {
    // Récupérer tous les sous-dossiers
    const subFolders = await all('SELECT id FROM folders WHERE parent_id = ?', [folderId]);
    
    // Supprimer récursivement chaque sous-dossier
    for (const subFolder of subFolders) {
      await deleteFolderRecursive(subFolder.id);
    }
    
    // Supprimer tous les fichiers de ce dossier
    await run('DELETE FROM files WHERE folder_id = ?', [folderId]);
    
    // Supprimer le dossier lui-même
    await run('DELETE FROM folders WHERE id = ?', [folderId]);
    
    console.log(`Dossier ${folderId} et son contenu supprimés récursivement`);
    
  } catch (error) {
    console.error(`Erreur lors de la suppression récursive du dossier ${folderId}:`, error);
    throw error;
  }
}

module.exports = router;

