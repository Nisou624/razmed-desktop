/**
 * Système de gestion de la vue (Liste / Grille)
 */

class ViewModeManager {
  constructor() {
    this.STORAGE_KEY = 'sntp-view-mode';
    this.currentMode = this.loadViewMode();
    this.init();
  }

  /**
   * Initialiser le système
   */
  init() {
    this.applyViewMode(this.currentMode);
    this.injectStyles();
  }

  /**
   * Charger le mode de vue sauvegardé
   */
  loadViewMode() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'grid'; // 'grid' ou 'list'
  }

  /**
   * Sauvegarder la préférence
   */
  saveViewMode(mode) {
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.currentMode = mode;
  }

  /**
   * Appliquer un mode de vue
   */
  applyViewMode(mode) {
    this.saveViewMode(mode);

    // Retirer les anciennes classes
    document.documentElement.classList.remove('view-grid', 'view-list');

    // Ajouter la nouvelle classe
    document.documentElement.classList.add(`view-${mode}`);

    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('viewModeChanged', {
      detail: { mode }
    }));

    // Mettre à jour l'affichage des dossiers
    this.updateFoldersDisplay(mode);
  }

  /**
   * Basculer entre les modes
   */
  toggle() {
    const newMode = this.currentMode === 'grid' ? 'list' : 'grid';
    this.applyViewMode(newMode);
    return newMode;
  }

  /**
   * Obtenir le mode actuel
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Mettre à jour l'affichage des dossiers
   */
  updateFoldersDisplay(mode) {
    const foldersContainer = document.getElementById('folders-container');
    if (!foldersContainer) return;

    if (mode === 'list') {
      foldersContainer.className = 'folders-list-view';
    } else {
      foldersContainer.className = 'row g-4';
    }
  }

  /**
   * Injecter le sélecteur de vue dans l'interface
   */
  injectViewSelector(containerId = 'view-selector-container') {
    const container = document.getElementById(containerId) || document.body;

    const html = `
      <div class="view-mode-selector">
        <button class="view-mode-btn" data-mode="grid" title="Vue en grille">
          <i class="bi bi-grid-3x3-gap-fill"></i>
        </button>
        <button class="view-mode-btn" data-mode="list" title="Vue en liste">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // Attacher les événements
    this.attachEvents();

    // Mettre à jour l'affichage
    this.updateSelectorDisplay();
  }

  /**
   * Injecter les styles CSS
   */
  injectStyles() {
    if (document.getElementById('view-mode-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'view-mode-styles';
    styles.textContent = `
      /* Sélecteur de vue */
      .view-mode-selector {
        display: inline-flex;
        background: var(--bg-secondary, #f8f9fa);
        border: 2px solid var(--border-color, #dee2e6);
        border-radius: 8px;
        padding: 4px;
        gap: 4px;
      }

      .view-mode-btn {
        background: transparent;
        border: none;
        padding: 8px 12px;
        cursor: pointer;
        color: var(--text-secondary, #6c757d);
        border-radius: 6px;
        transition: all 0.2s ease;
        font-size: 1.1rem;
      }

      .view-mode-btn:hover {
        background: var(--bg-tertiary, #e9ecef);
        color: var(--text-primary, #212529);
      }

      .view-mode-btn.active {
        background: #667eea;
        color: white;
      }

      /* Vue en liste */
      .folders-list-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .view-list .folder-card {
        display: flex;
        flex-direction: row !important;
        align-items: center;
        padding: 16px 20px !important;
      }

      .view-list .folder-card-body {
        flex-direction: row !important;
        width: 100%;
        gap: 20px !important;
        padding: 0 !important;
      }

      .view-list .folder-icon {
        width: 50px !important;
        height: 50px !important;
        font-size: 1.5rem !important;
      }

      .view-list .folder-title {
        text-align: left !important;
        font-size: 1.1rem !important;
        min-height: auto !important;
        flex: 1;
      }

      .view-list .file-count,
      .view-list .subfolder-badge {
        margin: 0 !important;
      }

      .view-list .btn-open {
        width: auto !important;
        margin: 0 !important;
      }

      /* Vue en grille (par défaut) */
      .view-grid .folder-card-body {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      /* Animation de transition */
      .folder-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Liste pour les fichiers */
      .view-list .file-item {
        padding: 16px 20px !important;
      }

      .view-list .file-info {
        flex-direction: row !important;
        gap: 15px !important;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .view-mode-selector {
          width: 100%;
          justify-content: center;
        }

        .view-mode-btn {
          flex: 1;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Attacher les événements
   */
  attachEvents() {
    const buttons = document.querySelectorAll('.view-mode-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.applyViewMode(mode);
        this.updateSelectorDisplay();
      });
    });
  }

  /**
   * Mettre à jour l'affichage du sélecteur
   */
  updateSelectorDisplay() {
    const buttons = document.querySelectorAll('.view-mode-btn');
    const currentMode = this.getCurrentMode();

    buttons.forEach(btn => {
      if (btn.dataset.mode === currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Recharger l'affichage des dossiers avec le nouveau mode
   */
  refreshFoldersDisplay() {
    // Cette fonction sera appelée par l'application principale
    // pour recharger l'affichage des dossiers
    if (window.app && window.app.currentView && window.app.currentView.render) {
      window.app.currentView.render();
    }
  }
}

// Initialiser le gestionnaire de vue
const viewModeManager = new ViewModeManager();

// Exposer globalement
window.viewModeManager = viewModeManager;
