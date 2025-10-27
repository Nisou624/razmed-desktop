/**
 * Système de gestion des thèmes (Clair / Sombre)
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'sntp-theme-preference';
    this.currentTheme = this.loadTheme();
    this.init();
  }

  /**
   * Initialiser le système de thèmes
   */
  init() {
    // Appliquer le thème sauvegardé
    this.applyTheme(this.currentTheme);

    // Écouter les changements de préférence système
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme === 'auto') {
          this.applyTheme('auto');
        }
      });
    }
  }

  /**
   * Charger le thème sauvegardé
   */
  loadTheme() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'auto'; // 'light', 'dark', 'auto'
  }

  /**
   * Sauvegarder la préférence de thème
   */
  saveTheme(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.currentTheme = theme;
  }

  /**
   * Obtenir le thème effectif (résoudre 'auto')
   */
  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      // Détecter la préférence système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return this.currentTheme;
  }

  /**
   * Appliquer un thème
   */
  applyTheme(theme) {
    this.saveTheme(theme);
    const effectiveTheme = this.getEffectiveTheme();

    // Retirer les anciennes classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');

    // Ajouter la nouvelle classe
    document.documentElement.classList.add(`theme-${effectiveTheme}`);

    // Mettre à jour le meta theme-color
    this.updateMetaThemeColor(effectiveTheme);

    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: effectiveTheme }
    }));
  }

  /**
   * Mettre à jour la couleur de thème du navigateur
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    const colors = {
      light: '#ffffff',
      dark: '#1a1a1a'
    };

    metaThemeColor.content = colors[theme];
  }

  /**
   * Basculer entre les thèmes
   */
  toggle() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.applyTheme(themes[nextIndex]);
    return themes[nextIndex];
  }

  /**
   * Définir un thème spécifique
   */
  setTheme(theme) {
    if (['light', 'dark', 'auto'].includes(theme)) {
      this.applyTheme(theme);
      return true;
    }
    return false;
  }

  /**
   * Obtenir le thème actuel
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Injecter le sélecteur de thème dans l'interface
   */
  injectThemeSelector(containerId = 'theme-selector-container') {
    const container = document.getElementById(containerId) || document.body;

    const html = `
      <div class="theme-selector" id="themeSelector">
        <button class="theme-toggle-btn" id="themeToggleBtn" title="Changer le thème">
          <i class="bi bi-sun-fill theme-icon-light"></i>
          <i class="bi bi-moon-fill theme-icon-dark"></i>
          <i class="bi bi-circle-half theme-icon-auto"></i>
          <span class="theme-label"></span>
        </button>
        <div class="theme-dropdown" id="themeDropdown">
          <button class="theme-option" data-theme="light">
            <i class="bi bi-sun-fill"></i>
            <span>Clair</span>
            <i class="bi bi-check theme-check"></i>
          </button>
          <button class="theme-option" data-theme="dark">
            <i class="bi bi-moon-fill"></i>
            <span>Sombre</span>
            <i class="bi bi-check theme-check"></i>
          </button>
          <button class="theme-option" data-theme="auto">
            <i class="bi bi-circle-half"></i>
            <span>Automatique</span>
            <i class="bi bi-check theme-check"></i>
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // Ajouter les styles
    this.injectStyles();

    // Attacher les événements
    this.attachEvents();

    // Mettre à jour l'affichage
    this.updateSelectorDisplay();
  }

  /**
   * Injecter les styles CSS
   */
  injectStyles() {
    if (document.getElementById('theme-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'theme-styles';
    styles.textContent = `
      /* Variables de thème clair */
      :root.theme-light {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --bg-tertiary: #e9ecef;
        --text-primary: #212529;
        --text-secondary: #6c757d;
        --text-tertiary: #adb5bd;
        --border-color: #dee2e6;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
        --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
        --shadow-lg: 0 8px 16px rgba(0,0,0,0.15);
        --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      /* Variables de thème sombre */
      :root.theme-dark {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --bg-tertiary: #3a3a3a;
        --text-primary: #ffffff;
        --text-secondary: #b0b0b0;
        --text-tertiary: #808080;
        --border-color: #404040;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.3);
        --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
        --shadow-lg: 0 8px 16px rgba(0,0,0,0.5);
        --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      /* Application du thème */
      body {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      .header {
        background-color: var(--bg-primary) !important;
        box-shadow: var(--shadow-md) !important;
      }

      .folder-card, .subfolder-card, .file-list {
        background-color: var(--bg-primary) !important;
        box-shadow: var(--shadow-md) !important;
        color: var(--text-primary) !important;
      }

      .folder-title, .subfolder-info h5, .file-details h6 {
        color: var(--text-primary) !important;
      }

      .file-details p, .subfolder-info p {
        color: var(--text-secondary) !important;
      }

      /* Sélecteur de thème */
      .theme-selector {
        position: relative;
        display: inline-block;
      }

      .theme-toggle-btn {
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-primary);
        font-size: 1rem;
        transition: all 0.3s ease;
      }

      .theme-toggle-btn:hover {
        background: var(--bg-tertiary);
        border-color: #667eea;
      }

      .theme-icon-light,
      .theme-icon-dark,
      .theme-icon-auto {
        display: none;
        font-size: 1.2rem;
      }

      :root.theme-light .theme-icon-light { display: block; color: #ffc107; }
      :root.theme-dark .theme-icon-dark { display: block; color: #667eea; }

      .theme-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        min-width: 180px;
        display: none;
        z-index: 1000;
      }

      .theme-dropdown.show {
        display: block;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .theme-option {
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.2s ease;
      }

      .theme-option:first-child {
        border-radius: 8px 8px 0 0;
      }

      .theme-option:last-child {
        border-radius: 0 0 8px 8px;
      }

      .theme-option:hover {
        background: var(--bg-secondary);
      }

      .theme-option i:first-child {
        font-size: 1.1rem;
        width: 20px;
      }

      .theme-option span {
        flex: 1;
        text-align: left;
      }

      .theme-check {
        opacity: 0;
        color: #667eea;
        font-size: 1.1rem;
      }

      .theme-option.active .theme-check {
        opacity: 1;
      }

      /* Adaptations du thème sombre */
      :root.theme-dark .breadcrumb-custom {
        background: var(--bg-secondary) !important;
      }

      :root.theme-dark .page-header {
        background: var(--bg-secondary) !important;
      }

      :root.theme-dark .empty-state {
        background: var(--bg-secondary) !important;
      }

      :root.theme-dark .login-card {
        background: var(--bg-secondary) !important;
      }

      :root.theme-dark .drop-zone {
        background: var(--bg-tertiary) !important;
        border-color: var(--border-color) !important;
      }

      :root.theme-dark .table-modern {
        border-color: var(--border-color) !important;
      }

      :root.theme-dark .table-modern th {
        background: var(--bg-tertiary) !important;
      }

      :root.theme-dark .table-modern td {
        border-color: var(--border-color) !important;
      }

      :root.theme-dark .modal-content {
        background: var(--bg-primary) !important;
        color: var(--text-primary) !important;
      }

      :root.theme-dark .form-control {
        background: var(--bg-tertiary) !important;
        border-color: var(--border-color) !important;
        color: var(--text-primary) !important;
      }

      :root.theme-dark .form-control:focus {
        background: var(--bg-secondary) !important;
        border-color: #667eea !important;
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Attacher les événements
   */
  attachEvents() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const dropdown = document.getElementById('themeDropdown');
    const options = document.querySelectorAll('.theme-option');

    // Toggle dropdown
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Fermer dropdown en cliquant ailleurs
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });

    // Empêcher la fermeture lors du clic sur le dropdown
    dropdown?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Sélection d'un thème
    options.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        this.setTheme(theme);
        this.updateSelectorDisplay();
        dropdown.classList.remove('show');
      });
    });
  }

  /**
   * Mettre à jour l'affichage du sélecteur
   */
  updateSelectorDisplay() {
    const options = document.querySelectorAll('.theme-option');
    const label = document.querySelector('.theme-label');
    const currentTheme = this.getCurrentTheme();

    // Mettre à jour les options actives
    options.forEach(option => {
      if (option.dataset.theme === currentTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // Mettre à jour le label
    const labels = {
      light: 'Clair',
      dark: 'Sombre',
      auto: 'Auto'
    };

    if (label) {
      label.textContent = labels[currentTheme] || '';
    }
  }
}

// Initialiser le gestionnaire de thèmes
const themeManager = new ThemeManager();

// Exposer globalement
window.themeManager = themeManager;
