renderFiles() {
    let html = '';

    for (const file of this.files) {
      const ext = file.filename.split('.').pop().toLowerCase();
      const fileIcons = {
        'pdf': 'bi-file-earmark-pdf',
        'doc': 'bi-file-earmark-word',
        'docx': 'bi-file-earmark-word',
        'xls': 'bi-file-earmark-excel',
        'xlsx': 'bi-file-earmark-excel',
        'ppt': 'bi-file-earmark-ppt',
        'pptx': 'bi-file-earmark-ppt',
        'jpg': 'bi-file-earmark-image',
        'jpeg': 'bi-file-earmark-image',
        'png': 'bi-file-earmark-image',
        'gif': 'bi-file-earmark-image',
        'txt': 'bi-file-earmark-text',
        'zip': 'bi-file-earmark-zip',
        'rar': 'bi-file-earmark-zip',
      };

      const fileIcon = fileIcons[ext] || 'bi-file-earmark';
      const uploadDate = new Date(file.uploaded_at);
      const formattedDate = uploadDate.toLocaleDateString('fr-FR');

      // Déterminer les permissions selon le type de fichier
      const isPdf = ext === 'pdf';
      const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
      const isViewable = isPdf || isOffice || ['txt', 'jpg', 'jpeg', 'png', 'gif'].includes(ext);
      
      html += `
        <div style="padding: 20px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s;">
          <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.3rem;">
              <i class="bi ${fileIcon}"></i>
            </div>
            <div>
              <h6 style="margin: 0; color: #212529; font-weight: 600;">${file.filename}</h6>
              <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.85rem;">
                <i class="bi bi-calendar3"></i> ${formattedDate}
                ${isPdf ? '<span class="badge bg-danger ms-2"><i class="bi bi-lock-fill"></i> Vue seule</span>' : ''}
                ${isOffice ? '<span class="badge bg-success ms-2"><i class="bi bi-check-circle-fill"></i> Téléchargeable</span>' : ''}
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            ${isViewable ? `
              <button onclick="openFilePreview(${file.id}, '${file.filename}')" class="btn btn-sm" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; border: none; cursor: pointer;">
                <i class="bi bi-eye"></i> Prévisualiser
              </button>
            ` : `
              <button disabled class="btn btn-sm" style="background: #e9ecef; color: #6c757d; padding: 8px 16px; border-radius: 8px; font-weight: 600; border: none; cursor: not-allowed;">
                <i class="bi bi-eye-slash"></i> Non visualisable
              </button>
            `}
            ${isPdf ? `
              <button class="btn btn-sm" style="background: #e9ecef; color: #6c757d; padding: 8px 16px; border-radius: 8px; font-weight: 600; border: none; cursor: not-allowed;" title="Les fichiers PDF ne sont pas téléchargeables">
                <i class="bi bi-download"></i> Non téléchargeable
              </button>
            ` : `
              <a href="/api/files/${file.id}/download" class="btn btn-sm" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                <i class="bi bi-download"></i> Télécharger
              </a>
            `}
          </div>
        </div>
      `;
    }

    return html;
  }
}

// Fonction globale pour ouvrir la prévisualisation
function openFilePreview(fileId, filename) {
  // Créer une modale pour la prévisualisation
  const modal = document.createElement('div');
  modal.id = 'previewModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="width: 95%; height: 95%; background: white; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="color: white; margin: 0; font-size: 1.2rem;">
          <i class="bi bi-eye-fill"></i> Prévisualisation : ${filename}
        </h3>
        <button onclick="closePreviewModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 1.1rem; transition: all 0.3s;">
          <i class="bi bi-x-lg"></i> Fermer
        </button>
      </div>
      <div style="flex: 1; overflow: hidden; position: relative;">
        <div id="previewLoader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="width: 60px; height: 60px; border: 5px solid #f3f3f3; border-top: 5px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <p style="color: #667eea; font-size: 1.1rem; font-weight: 600;">Chargement de la prévisualisation...</p>
        </div>
        <iframe id="previewFrame" style="width: 100%; height: 100%; border: none; display: none;"></iframe>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(modal);

  // Charger la prévisualisation
  const iframe = document.getElementById('previewFrame');
  const loader = document.getElementById('previewLoader');

  iframe.onload = () => {
    loader.style.display = 'none';
    iframe.style.display = 'block';
  };

  iframe.onerror = () => {
    loader.innerHTML = `
      <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: #dc3545;"></i>
      <p style="color: #dc3545; font-size: 1.1rem; font-weight: 600; margin-top: 20px;">
        Erreur lors du chargement de la prévisualisation
      </p>
    `;
  };

  iframe.src = `/api/preview/${fileId}`;

  // Fermer avec Echap
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closePreviewModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  if (modal) {
    modal.remove();
  }
}// Application principale
class App {
  constructor() {
    this.currentView = null;
    this.isAdmin = false;
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Vérifier l'authentification
    await this.checkAuth();
    
    // Router simple
    this.handleRouting();
    
    // Gérer les changements d'URL
    window.addEventListener('popstate', () => {
      this.handleRouting();
    });
  }

  async checkAuth() {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        this.isAdmin = true;
        this.currentUser = data.admin;
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    }
  }

  handleRouting() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/' || path === '/index.html') {
      if (this.isAdmin) {
        this.showPublicView();
      } else {
        this.showPublicView();
      }
    } else if (path === '/admin' || path.startsWith('/admin')) {
      if (this.isAdmin) {
        this.showAdminDashboard();
      } else {
        this.showLogin();
      }
    } else if (path === '/login') {
      this.showLogin();
    } else if (path.startsWith('/folder/')) {
      const folderId = path.split('/')[2];
      this.showFolder(folderId);
    } else {
      this.showPublicView();
    }
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRouting();
  }

  showPublicView() {
    this.render(new PublicView(this));
  }

  showLogin() {
    this.render(new LoginView(this));
  }

  showAdminDashboard() {
    this.render(new AdminDashboard(this));
  }

  showFolder(folderId) {
    this.render(new FolderView(this, folderId));
  }

  render(view) {
    this.currentView = view;
    view.render();
  }
}

// Vue publique - Liste des dossiers
class PublicView {
  constructor(app) {
    this.app = app;
    this.folders = [];
  }

  async loadFolders() {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      
      if (data.success) {
        this.folders = data.folders;
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    }
  }

  buildFolderTree(folders, parentId = null) {
    const tree = [];
    
    for (const folder of folders) {
      if ((folder.parent_id || null) === parentId) {
        const children = this.buildFolderTree(folders, folder.id);
        if (children.length > 0) {
          folder.children = children;
        }
        tree.push(folder);
      }
    }
    
    return tree;
  }

  async countFiles(folderId) {
    try {
      const response = await fetch(`/api/folders/${folderId}/count`);
      const data = await response.json();
      return data.success ? data.count : 0;
    } catch (error) {
      return 0;
    }
  }

  async render() {
    await this.loadFolders();
    const folderTree = this.buildFolderTree(this.folders);

    const html = `
      <div class="header">
        <div class="container">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <i class="bi bi-folder-fill" style="font-size: 2.5rem; color: #667eea;"></i>
              <div>
                <h1 style="font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                  Portail Document
                </h1>
                <p style="color: #6c757d; margin: 0;">Société Nationale des Travaux Publics</p>
              </div>
            </div>
            ${this.app.isAdmin ? `
              <button class="btn btn-gradient" onclick="app.navigate('/admin')">
                <i class="bi bi-gear-fill"></i> Administration
              </button>
            ` : `
              <button class="btn btn-gradient" onclick="app.navigate('/login')">
                <i class="bi bi-box-arrow-in-right"></i> Connexion Admin
              </button>
            `}
          </div>
        </div>
      </div>

      <div class="container">
        <h2 class="text-center text-white mb-4" style="font-size: 2.5rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
          <i class="bi bi-collection"></i> Bibliothèque de Documents
        </h2>
        <p class="text-center text-white mb-5" style="font-size: 1.2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
          Explorez et accédez à tous vos documents organisés par catégorie
        </p>

        <div class="row g-4" id="folders-container">
          ${folderTree.length > 0 ? await this.renderFolders(folderTree) : `
            <div class="col-12">
              <div style="background: white; border-radius: 16px; padding: 60px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                <i class="bi bi-inbox" style="font-size: 5rem; color: #6c757d; opacity: 0.5;"></i>
                <h3 style="color: #212529; margin-top: 20px;">Aucun dossier disponible</h3>
                <p style="color: #6c757d;">Les dossiers apparaîtront ici une fois ajoutés.</p>
              </div>
            </div>
          `}
        </div>
      </div>

      <div class="text-center text-white mt-5 py-4">
        <p>&copy; ${new Date().getFullYear()} <strong>Société Nationale des Travaux Publics</strong> - Tous droits réservés</p>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  async renderFolders(folders, level = 0) {
    let html = '';
    const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
    const icons = ['bi-folder-fill', 'bi-folder2', 'bi-folder2-open', 'bi-archive-fill', 'bi-journal-text'];

    for (const folder of folders) {
      const colorClass = colors[Math.min(level, 4)];
      const iconClass = icons[Math.min(level, 4)];
      const fileCount = await this.countFiles(folder.id);

      html += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="folder-card" onclick="app.navigate('/folder/${folder.id}')">
            <div style="padding: 25px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 15px;">
              <div style="width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <i class="bi ${iconClass}"></i>
              </div>
              <h5 style="font-size: 1.1rem; font-weight: 600; color: #212529; margin: 0; min-height: 50px; display: flex; align-items: center;">
                ${folder.name}
              </h5>
              ${fileCount > 0 ? `
                <span class="badge bg-primary" style="font-size: 0.85rem; padding: 6px 12px; border-radius: 20px;">
                  <i class="bi bi-file-earmark-text"></i> ${fileCount} fichier${fileCount > 1 ? 's' : ''}
                </span>
              ` : ''}
              ${folder.children ? `
                <span class="badge bg-secondary" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 15px;">
                  <i class="bi bi-folders"></i> ${folder.children.length} sous-dossier${folder.children.length > 1 ? 's' : ''}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      if (folder.children) {
        html += await this.renderFolders(folder.children, level + 1);
      }
    }

    return html;
  }
}

// Vue de connexion
class LoginView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const html = `
      <div class="login-container">
        <div class="login-card">
          <div class="text-center mb-4">
            <i class="bi bi-shield-lock-fill" style="font-size: 4rem; color: #667eea;"></i>
            <h2 style="margin-top: 20px; font-weight: 700; color: #212529;">Connexion Admin</h2>
            <p style="color: #6c757d;">Société Nationale des Travaux Publics</p>
          </div>

          <form id="login-form" onsubmit="return false;">
            <div class="mb-3">
              <label class="form-label" style="font-weight: 600;">Email</label>
              <input type="email" class="form-control form-control-lg" id="email" required>
            </div>
            <div class="mb-3">
              <label class="form-label" style="font-weight: 600;">Mot de passe</label>
              <input type="password" class="form-control form-control-lg" id="password" required>
            </div>
            <div id="error-message" class="alert alert-danger d-none"></div>
            <button type="submit" class="btn btn-gradient w-100 btn-lg">
              <i class="bi bi-box-arrow-in-right"></i> Se connecter
            </button>
          </form>

          <div class="text-center mt-3">
            <button class="btn btn-link" onclick="app.navigate('/')">
              <i class="bi bi-arrow-left"></i> Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;

    // Gérer la soumission du formulaire
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.app.isAdmin = true;
        this.app.currentUser = data.admin;
        this.app.navigate('/admin');
      } else {
        errorDiv.textContent = data.error || 'Erreur de connexion';
        errorDiv.classList.remove('d-none');
      }
    } catch (error) {
      console.error('Erreur login:', error);
      errorDiv.textContent = 'Erreur de connexion au serveur';
      errorDiv.classList.remove('d-none');
    }
  }
}

// Vue Admin Dashboard
class AdminDashboard {
  constructor(app) {
    this.app = app;
    this.folders = [];
  }

  async loadFolders() {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      
      if (data.success) {
        this.folders = data.folders;
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    }
  }

  async render() {
    await this.loadFolders();

    const html = `
      <div class="admin-nav">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center">
            <button class="btn btn-outline-light" onclick="app.navigate('/')">
              <i class="bi bi-arrow-left"></i> Retour
            </button>
            <h4 class="text-white m-0">
              <i class="bi bi-gear-fill"></i> Administration
            </h4>
            <button class="btn btn-outline-light" onclick="handleLogout()">
              <i class="bi bi-box-arrow-right"></i> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 30px;">
          <h2 style="font-size: 2rem; font-weight: 600; margin-bottom: 25px;">
            <i class="bi bi-folder-fill"></i> Gérer les Dossiers
          </h2>

          <!-- Zone de drag & drop -->
          <div class="drop-zone" id="dropZone">
            <input type="file" id="folderInput" webkitdirectory directory multiple style="display: none;">
            <div>
              <i class="bi bi-cloud-upload" style="font-size: 4rem; color: #667eea;"></i>
              <div style="font-size: 1.2rem; font-weight: 600; color: #212529; margin-top: 15px;">
                Glissez un dossier ici
              </div>
              <div style="font-size: 0.9rem; color: #6c757d; margin-top: 5px;">
                ou cliquez pour sélectionner un dossier avec son arborescence
              </div>
            </div>
          </div>

          <!-- Barre de progression -->
          <div id="uploadProgress" style="display: none; margin-top: 20px;">
            <div class="progress" style="height: 30px; border-radius: 8px;">
              <div class="progress-bar" id="progressBar" style="width: 0%; background-color: #667eea;">0%</div>
            </div>
            <div id="uploadStatus" style="margin-top: 15px; font-size: 0.9rem; color: #6c757d;"></div>
          </div>

          <!-- Zone d'alertes -->
          <div id="alertZone"></div>

          <button class="btn btn-gradient mb-3" onclick="showCreateFolderModal()">
            <i class="bi bi-plus-circle-fill"></i> Nouveau Dossier
          </button>

          <div id="folders-tree">
            ${this.renderFolderTree()}
          </div>
        </div>
      </div>

      <!-- Modal création dossier -->
      <div class="modal fade" id="createFolderModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Créer un nouveau dossier</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="parent_folder_id">
              <div class="mb-3">
                <label class="form-label">Nom du dossier</label>
                <input type="text" class="form-control" id="folder_name" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="button" class="btn btn-gradient" onclick="createFolder()">Créer</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
    this.initDragAndDrop();
  }

  renderFolderTree(folders = this.folders, parentId = null, level = 0) {
    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += '<thead><tr><th>Nom</th><th style="text-align: right;">Actions</th></tr></thead><tbody>';

    for (const folder of folders) {
      if ((folder.parent_id || null) === parentId) {
        const indent = '&nbsp;'.repeat(level * 4);
        const children = this.getChildren(folders, folder.id);
        const hasChildren = children.length > 0;

        html += `
          <tr data-folder-id="${folder.id}">
            <td>
              ${indent}
              ${hasChildren ? '<i class="bi bi-caret-right-fill toggle-arrow" style="cursor:pointer;"></i>' : '<span style="display:inline-block;width:12px;"></span>'}
              <i class="bi bi-folder2" style="color: #667eea;"></i>
              <strong>${folder.name}</strong>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-sm btn-gradient" onclick="showCreateFolderModal(${folder.id})">
                <i class="bi bi-plus-circle"></i> Nouveau
              </button>
              <button class="btn btn-sm btn-warning" onclick="showRenameFolderModal(${folder.id}, '${folder.name.replace(/'/g, "\\'")}')">
                <i class="bi bi-pencil"></i> Renommer
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteFolder(${folder.id})">
                <i class="bi bi-trash"></i> Supprimer
              </button>
            </td>
          </tr>
        `;

        if (hasChildren) {
          html += this.renderFolderTree(folders, folder.id, level + 1);
        }
      }
    }

    html += '</tbody></table></div>';
    return html;
  }

  getChildren(folders, parentId) {
    return folders.filter(f => f.parent_id === parentId);
  }

  initDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const folderInput = document.getElementById('folderInput');

    // Empêcher le comportement par défaut
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Ajouter l'effet visuel
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
      });
    });

    // Gérer le drop
    dropZone.addEventListener('drop', (e) => {
      const items = e.dataTransfer.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry();
          if (item && item.isDirectory) {
            this.uploadFolder(item);
          }
        }
      }
    });

    // Gérer le clic
    dropZone.addEventListener('click', () => {
      folderInput.click();
    });

    // Gérer la sélection
    folderInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadFolderFromInput(e.target.files);
      }
    });
  }

  async uploadFolder(folderEntry) {
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'block';

    const files = [];
    await this.readDirectory(folderEntry, folderEntry.name, files);

    if (files.length === 0) {
      this.showAlert('Le dossier est vide', 'warning');
      uploadProgress.style.display = 'none';
      return;
    }

    await this.uploadFiles(files, folderEntry.name);
  }

  async readDirectory(directoryEntry, basePath, files) {
    return new Promise((resolve) => {
      const reader = directoryEntry.createReader();

      function readEntries() {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }

          for (const entry of entries) {
            if (entry.isFile) {
              const file = await getFile(entry);
              const relativePath = basePath + '/' + entry.name;
              files.push({
                file: file,
                relativePath: relativePath,
                folders: basePath.split('/')
              });
            } else if (entry.isDirectory) {
              await this.readDirectory(entry, basePath + '/' + entry.name, files);
            }
          }

          readEntries();
        });
      }

      readEntries();
    });

    function getFile(fileEntry) {
      return new Promise((resolve) => {
        fileEntry.file((file) => resolve(file));
      });
    }
  }

  async uploadFolderFromInput(files) {
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'block';

    const filesArray = [];
    let rootFolderName = 'Nouveau Dossier';

    if (files[0].webkitRelativePath) {
      rootFolderName = files[0].webkitRelativePath.split('/')[0];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const folders = relativePath.split('/');
      folders.pop(); // Enlever le nom du fichier

      filesArray.push({
        file: file,
        relativePath: relativePath,
        folders: folders
      });
    }

    await this.uploadFiles(filesArray, rootFolderName);
  }

  async uploadFiles(filesArray, rootFolderName) {
    const totalFiles = filesArray.length;
    const progressBar = document.getElementById('progressBar');
    const uploadStatus = document.getElementById('uploadStatus');

    uploadStatus.textContent = `Upload de ${totalFiles} fichier(s)...`;

    const formData = new FormData();
    
    filesArray.forEach((fileData, index) => {
      formData.append('files', fileData.file);
    });

    formData.append('folderStructure', JSON.stringify(filesArray.map(f => ({
      folders: f.folders,
      filename: f.file.name
    }))));

    try {
      const response = await fetch('/api/files/upload-folder', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        this.showAlert(`✅ ${result.uploaded} fichier(s) uploadé(s) avec succès !`, 'success');
        
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else {
        this.showAlert('Erreur lors de l\'upload', 'danger');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      this.showAlert('Erreur lors de l\'upload', 'danger');
    }
  }

  showAlert(message, type) {
    const alertZone = document.getElementById('alertZone');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertZone.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

// Vue dossier
class FolderView {
  constructor(app, folderId) {
    this.app = app;
    this.folderId = folderId;
    this.folder = null;
    this.subfolders = [];
    this.files = [];
    this.breadcrumb = [];
  }

  async loadData() {
    try {
      // Charger le dossier
      const response = await fetch(`/api/folders/${this.folderId}`);
      const data = await response.json();

      if (data.success) {
        this.folder = data.folder;
        this.subfolders = data.subfolders;
        this.files = data.files;
      }

      // Charger le breadcrumb
      const pathResponse = await fetch(`/api/folders/${this.folderId}/path`);
      const pathData = await pathResponse.json();

      if (pathData.success) {
        this.breadcrumb = pathData.path;
      }
    } catch (error) {
      console.error('Erreur chargement dossier:', error);
    }
  }

  async render() {
    await this.loadData();

    if (!this.folder) {
      document.getElementById('app').innerHTML = `
        <div class="container text-center mt-5">
          <h2 class="text-white">Dossier introuvable</h2>
          <button class="btn btn-gradient mt-3" onclick="app.navigate('/')">
            <i class="bi bi-arrow-left"></i> Retour à l'accueil
          </button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="header">
        <div class="container">
          <button class="btn btn-gradient" onclick="app.navigate('/')">
            <i class="bi bi-arrow-left-circle"></i> Retour à l'accueil
          </button>
        </div>
      </div>

      <div class="container">
        <!-- Breadcrumb -->
        <div style="background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 30px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <i class="bi bi-house-door"></i>
          <a href="#" onclick="app.navigate('/'); return false;" style="color: #667eea; text-decoration: none; font-weight: 500;">Accueil</a>
          ${this.breadcrumb.map((crumb, index) => `
            <span style="color: #6c757d;"><i class="bi bi-chevron-right"></i></span>
            ${index === this.breadcrumb.length - 1 ? `
              <span style="color: #212529; font-weight: 600;">${crumb.name}</span>
            ` : `
              <a href="#" onclick="app.navigate('/folder/${crumb.id}'); return false;" style="color: #667eea; text-decoration: none; font-weight: 500;">
                ${crumb.name}
              </a>
            `}
          `).join('')}
        </div>

        <!-- En-tête -->
        <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 30px;">
          <div class="d-flex align-items-center gap-3">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem;">
              <i class="bi bi-folder-open"></i>
            </div>
            <h1 style="font-size: 2rem; font-weight: 700; color: #212529; margin: 0;">
              ${this.folder.name}
            </h1>
          </div>
        </div>

        ${this.subfolders.length > 0 ? `
          <h2 class="text-white mb-4" style="font-size: 1.5rem; font-weight: 600;">
            <i class="bi bi-folders"></i> Sous-dossiers (${this.subfolders.length})
          </h2>
          <div class="row g-3 mb-5">
            ${await this.renderSubfolders()}
          </div>
        ` : ''}

        ${this.files.length > 0 ? `
          <h2 class="text-white mb-4" style="font-size: 1.5rem; font-weight: 600;">
            <i class="bi bi-file-earmark-text"></i> Fichiers (${this.files.length})
          </h2>
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
            ${this.renderFiles()}
          </div>
        ` : this.subfolders.length === 0 ? `
          <div style="background: white; border-radius: 12px; padding: 60px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <i class="bi bi-inbox" style="font-size: 4rem; color: #6c757d; opacity: 0.5;"></i>
            <h4 style="color: #212529; margin-top: 20px;">Dossier vide</h4>
            <p style="color: #6c757d;">Ce dossier ne contient aucun fichier ni sous-dossier.</p>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  async renderSubfolders() {
    let html = '';

    for (const subfolder of this.subfolders) {
      const response = await fetch(`/api/folders/${subfolder.id}/count`);
      const data = await response.json();
      const fileCount = data.success ? data.count : 0;

      html += `
        <div class="col-md-6 col-lg-4">
          <div class="folder-card" onclick="app.navigate('/folder/${subfolder.id}')">
            <div style="padding: 20px; display: flex; align-items: center; gap: 15px;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                <i class="bi bi-folder2"></i>
              </div>
              <div style="flex: 1;">
                <h5 style="margin: 0; color: #212529; font-weight: 600; font-size: 1.1rem;">
                  ${subfolder.name}
                </h5>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.85rem;">
                  <i class="bi bi-file-earmark"></i> ${fileCount} fichier${fileCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  renderFiles() {
    let html = '';

    for (const file of this.files) {
      const ext = file.filename.split('.').pop().toLowerCase();
      const fileIcons = {
        'pdf': 'bi-file-earmark-pdf',
        'doc': 'bi-file-earmark-word',
        'docx': 'bi-file-earmark-word',
        'xls': 'bi-file-earmark-excel',
        'xlsx': 'bi-file-earmark-excel',
        'ppt': 'bi-file-earmark-ppt',
        'pptx': 'bi-file-earmark-ppt',
        'jpg': 'bi-file-earmark-image',
        'jpeg': 'bi-file-earmark-image',
        'png': 'bi-file-earmark-image',
        'gif': 'bi-file-earmark-image',
        'txt': 'bi-file-earmark-text',
        'zip': 'bi-file-earmark-zip',
        'rar': 'bi-file-earmark-zip',
      };

      const fileIcon = fileIcons[ext] || 'bi-file-earmark';
      const uploadDate = new Date(file.uploaded_at);
      const formattedDate = uploadDate.toLocaleDateString('fr-FR');

      html += `
        <div style="padding: 20px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s;">
          <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.3rem;">
              <i class="bi ${fileIcon}"></i>
            </div>
            <div>
              <h6 style="margin: 0; color: #212529; font-weight: 600;">${file.filename}</h6>
              <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.85rem;">
                <i class="bi bi-calendar3"></i> ${formattedDate}
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="/${file.filepath}" target="_blank" class="btn btn-sm" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              <i class="bi bi-eye"></i> Voir
            </a>
            <a href="/api/files/${file.id}/download" class="btn btn-sm" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              <i class="bi bi-download"></i> Télécharger
            </a>
          </div>
        </div>
      `;
    }

    return html;
  }
}

// Fonctions globales
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    app.isAdmin = false;
    app.currentUser = null;
    app.navigate('/');
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
}

function showCreateFolderModal(parentId = null) {
  document.getElementById('parent_folder_id').value = parentId || '';
  document.getElementById('folder_name').value = '';
  const modal = new bootstrap.Modal(document.getElementById('createFolderModal'));
  modal.show();
}

async function createFolder() {
  const name = document.getElementById('folder_name').value.trim();
  const parentId = document.getElementById('parent_folder_id').value || null;

  if (!name) {
    alert('Veuillez entrer un nom de dossier');
    return;
  }

  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name: name,
        parent_id: parentId
      })
    });

    const data = await response.json();

    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('createFolderModal')).hide();
      location.reload();
    } else {
      alert(data.error || 'Erreur lors de la création du dossier');
    }
  } catch (error) {
    console.error('Erreur création dossier:', error);
    alert('Erreur lors de la création du dossier');
  }
}

async function deleteFolder(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
    return;
  }

  try {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.error || 'Erreur lors de la suppression du dossier');
    }
  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    alert('Erreur lors de la suppression du dossier');
  }
}

// Initialiser l'application
const app = new App();
