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
                    <i class="bi bi-eye-fill"></i> Prévisualisation - ${filename}
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
}

// Application principale
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
        window.addEventListener('popstate', () => this.handleRouting());
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check', { credentials: 'include' });
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
            if (folder.parent_id === parentId) {
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
                        <div>
                            ${this.app.isAdmin 
                                ? `<button class="btn btn-gradient" onclick="app.navigate('/admin')">
                                     <i class="bi bi-gear-fill"></i> Administration
                                   </button>`
                                : `<button class="btn btn-gradient" onclick="app.navigate('/login')">
                                     <i class="bi bi-box-arrow-in-right"></i> Connexion Admin
                                   </button>`
                            }
                        </div>
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

                ${folderTree.length > 0 
                    ? `<div class="row g-4">
                         ${await this.renderFolders(folderTree)}
                       </div>`
                    : `<div class="text-center text-white py-5">
                         <i class="bi bi-folder-x" style="font-size: 4rem; opacity: 0.5;"></i>
                         <h3 class="mt-3">Aucun dossier disponible</h3>
                         <p>Contactez l'administrateur pour ajouter des documents</p>
                       </div>`
                }
            </div>
        `;

        document.getElementById('app').innerHTML = html;
    }

    async renderFolders(folders, level = 0) {
        let html = '';
        
        for (const folder of folders) {
            const fileCount = await this.countFiles(folder.id);
            const iconClass = level === 0 ? 'bi-folder-fill' : 'bi-folder2-open';
            
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
                            ${fileCount > 0 
                                ? `<span class="badge bg-primary" style="font-size: 0.85rem; padding: 6px 12px; border-radius: 20px;">
                                     <i class="bi bi-file-earmark-text"></i> ${fileCount} fichier${fileCount > 1 ? 's' : ''}
                                   </span>`
                                : ''
                            }
                            ${folder.children 
                                ? `<span class="badge bg-secondary" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 15px;">
                                     <i class="bi bi-folders"></i> ${folder.children.length} sous-dossier${folder.children.length > 1 ? 's' : ''}
                                   </span>`
                                : ''
                            }
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
                headers: { 'Content-Type': 'application/json' },
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
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="bi bi-folder-plus"></i> Gestion des Dossiers</h5>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-primary mb-3" onclick="showCreateFolderModal()">
                                    <i class="bi bi-plus-circle"></i> Nouveau Dossier
                                </button>
                                ${await this.renderFoldersTable()}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="bi bi-upload"></i> Upload de Fichiers</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderUploadArea()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;
        this.initDragAndDrop();
    }

    async renderFoldersTable() {
        const folderTree = this.buildFolderTree(this.folders);
        
        if (folderTree.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="bi bi-folder-x" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-2">Aucun dossier créé. Commencez par créer votre premier dossier.</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Dossier</th>
                            <th>Fichiers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderFolderTree(folderTree)}
                    </tbody>
                </table>
            </div>
        `;
    }

    buildFolderTree(folders, parentId = null) {
        const tree = [];
        for (const folder of folders) {
            if (folder.parent_id === parentId) {
                const children = this.buildFolderTree(folders, folder.id);
                if (children.length > 0) {
                    folder.children = children;
                }
                tree.push(folder);
            }
        }
        return tree;
    }

    renderFolderTree(folders, parentId = null, level = 0) {
        let html = '';
        
        for (const folder of folders) {
            const indent = '&nbsp;'.repeat(level * 4);
            const hasChildren = folder.children && folder.children.length > 0;
            
            html += `
                <tr data-folder-id="${folder.id}">
                    <td>
                        ${indent}
                        ${hasChildren ? '<i class="bi bi-caret-right-fill toggle-arrow" style="cursor:pointer;"></i>' : '<span style="display:inline-block;width:12px;"></span>'}
                        <i class="bi bi-folder2" style="color: #667eea;"></i>
                        <strong>${folder.name}</strong>
                    </td>
                    <td>-</td>
                    <td style="text-align: right;">
                        <button class="btn btn-sm btn-gradient" onclick="showCreateFolderModal(${folder.id})">
                            <i class="bi bi-plus-circle"></i> Nouveau
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showRenameFolderModal(${folder.id}, '${folder.name.replace(\/'\/g, '\\\')}')">
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
        
        return html;
    }

    getChildren(folders, parentId) {
        return folders.filter(f => f.parent_id === parentId);
    }

    renderUploadArea() {
        return `
            <div class="upload-area" id="dropZone">
                <i class="bi bi-cloud-upload" style="font-size: 3rem; color: #667eea;"></i>
                <p class="mt-2">Glissez-déposez vos fichiers ici</p>
                <p class="text-muted">ou</p>
                <input type="file" id="fileInput" class="d-none" multiple>
                <button class="btn btn-outline-primary" onclick="document.getElementById('fileInput').click()">
                    Parcourir les fichiers
                </button>
            </div>
            <div id="uploadProgress" style="display: none; margin-top: 20px;">
                <div class="progress">
                    <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%"></div>
                </div>
                <div id="uploadStatus" class="mt-2"></div>
            </div>
        `;
    }

    initDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        // Empêcher le comportement par défaut
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Ajouter l'effet visuel
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
        });

        // Gérer le drop
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileUpload(files);
        });

        // Gérer l'input de fichier
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    async handleFileUpload(files) {
        const uploadProgress = document.getElementById('uploadProgress');
        uploadProgress.style.display = 'block';

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Fichiers uploadés avec succès !');
                this.render(); // Recharger la vue
            } else {
                alert('Erreur lors de l\'upload : ' + data.error);
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            alert('Erreur lors de l\'upload des fichiers');
        } finally {
            uploadProgress.style.display = 'none';
        }
    }
}

// Vue des dossiers (pour navigation)
class FolderView {
    constructor(app, folderId) {
        this.app = app;
        this.folderId = folderId;
        this.folder = null;
        this.files = [];
        this.breadcrumb = [];
    }

    async loadFolder() {
        try {
            const response = await fetch(`/api/folders/${this.folderId}`);
            const data = await response.json();
            
            if (data.success) {
                this.folder = data.folder;
                this.files = data.files || [];
                this.breadcrumb = data.breadcrumb || [];
            }
        } catch (error) {
            console.error('Erreur chargement dossier:', error);
        }
    }

    async render() {
        await this.loadFolder();

        if (!this.folder) {
            document.getElementById('app').innerHTML = `
                <div class="container py-5 text-center">
                    <h3>Dossier non trouvé</h3>
                    <button class="btn btn-primary" onclick="app.navigate('/')">Retour à l'accueil</button>
                </div>
            `;
            return;
        }

        const html = `
            <div class="header">
                <div class="container">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <button class="btn btn-outline-primary" onclick="app.navigate('/')">
                                <i class="bi bi-house-fill"></i> Accueil
                            </button>
                            ${this.renderBreadcrumb()}
                        </div>
                        <div>
                            ${this.app.isAdmin 
                                ? `<button class="btn btn-gradient" onclick="app.navigate('/admin')">
                                     <i class="bi bi-gear-fill"></i> Administration
                                   </button>`
                                : ''
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="bi bi-folder-open"></i> ${this.folder.name}</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderFiles()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;
    }

    renderBreadcrumb() {
        if (this.breadcrumb.length === 0) {
            return `<h4 class="m-0">${this.folder.name}</h4>`;
        }

        let breadcrumbHtml = '';
        for (let i = 0; i < this.breadcrumb.length; i++) {
            const item = this.breadcrumb[i];
            if (i === this.breadcrumb.length - 1) {
                breadcrumbHtml += `<span>${item.name}</span>`;
            } else {
                breadcrumbHtml += `<a href="#" onclick="app.navigate('/folder/${item.id}')">${item.name}</a> / `;
            }
        }

        return `<nav style="font-size: 1.1rem;">${breadcrumbHtml}</nav>`;
    }

    renderFiles() {
        if (this.files.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="bi bi-file-x" style="font-size: 4rem; color: #6c757d;"></i>
                    <h5 class="mt-3">Aucun fichier dans ce dossier</h5>
                    <p class="text-muted">Les fichiers seront affichés ici une fois ajoutés par l'administrateur</p>
                </div>
            `;
        }

        let html = '';
        for (const file of this.files) {
            const ext = file.filename.split('.').pop().toLowerCase();
            const formattedDate = new Date(file.uploaded_at).toLocaleDateString('fr-FR');
            
            // Déterminer l'icône du fichier
            let fileIcon = 'bi-file-earmark';
            if (['pdf'].includes(ext)) fileIcon = 'bi-file-earmark-pdf';
            else if (['doc', 'docx'].includes(ext)) fileIcon = 'bi-file-earmark-word';
            else if (['xls', 'xlsx'].includes(ext)) fileIcon = 'bi-file-earmark-excel';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) fileIcon = 'bi-file-earmark-image';
            else if (['txt'].includes(ext)) fileIcon = 'bi-file-earmark-text';

            // Déterminer les permissions selon le type de fichier
            const isPdf = ext === 'pdf';
            const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
            const isViewable = isPdf || isOffice || ['txt', 'jpg', 'jpeg', 'png', 'gif'].includes(ext);

            html += `
                <div style="padding: 20px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s;" class="file-item">
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
                        ` : ''}
                        ${!isPdf ? `
                            <a href="/uploads/${file.filepath}" download class="btn btn-sm btn-success" style="padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                                <i class="bi bi-download"></i> Télécharger
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return html;
    }
}

// Fonctions globales pour l'administration
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.app.isAdmin = false;
            window.app.currentUser = null;
            window.app.navigate('/');
        }
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}

function showCreateFolderModal(parentId = null) {
    const modalHtml = `
        <div class="modal fade" id="createFolderModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Créer un nouveau dossier</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createFolderForm">
                            <input type="hidden" id="parentId" value="${parentId || ''}">
                            <div class="mb-3">
                                <label for="folderName" class="form-label">Nom du dossier</label>
                                <input type="text" class="form-control" id="folderName" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" onclick="createFolder()">Créer</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('createFolderModal'));
    modal.show();
}

async function createFolder() {
    const name = document.getElementById('folderName').value;
    const parentId = document.getElementById('parentId').value || null;

    try {
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, parent_id: parentId })
        });

        const data = await response.json();
        
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('createFolderModal')).hide();
            window.app.currentView.render(); // Recharger la vue
        } else {
            alert('Erreur : ' + data.error);
        }
    } catch (error) {
        console.error('Erreur création dossier:', error);
        alert('Erreur lors de la création du dossier');
    }
}

// Supprimer le modal après fermeture
document.addEventListener('hidden.bs.modal', function (event) {
    if (event.target.id === 'createFolderModal') {
        event.target.remove();
    }
});

