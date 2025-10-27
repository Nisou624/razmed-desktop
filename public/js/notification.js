/**
 * Système de notifications
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 secondes
    this.init();
  }

  /**
   * Initialiser le système de notifications
   */
  init() {
    this.injectContainer();
    this.injectStyles();
    this.requestPermission();
  }

  /**
   * Demander la permission pour les notifications natives
   */
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.log('Notifications natives non supportées');
      }
    }
  }

  /**
   * Injecter le conteneur de notifications
   */
  injectContainer() {
    if (document.getElementById('notification-container')) return;

    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  /**
   * Injecter les styles CSS
   */
  injectStyles() {
    if (document.getElementById('notification-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .notification {
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .notification.removing {
        animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .notification::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
      }

      .notification.success::before {
        background: #28a745;
      }

      .notification.error::before {
        background: #dc3545;
      }

      .notification.warning::before {
        background: #ffc107;
      }

      .notification.info::before {
        background: #17a2b8;
      }

      .notification-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notification.success .notification-icon {
        color: #28a745;
      }

      .notification.error .notification-icon {
        color: #dc3545;
      }

      .notification.warning .notification-icon {
        color: #ffc107;
      }

      .notification.info .notification-icon {
        color: #17a2b8;
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #212529;
        margin: 0 0 4px 0;
      }

      .notification-message {
        font-size: 0.85rem;
        color: #6c757d;
        margin: 0;
        line-height: 1.4;
      }

      .notification-close {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 0;
        font-size: 1.2rem;
        line-height: 1;
        transition: color 0.2s;
        flex-shrink: 0;
      }

      .notification-close:hover {
        color: #212529;
      }

      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(0,0,0,0.1);
      }

      .notification-progress-bar {
        height: 100%;
        background: currentColor;
        animation: progressBar linear;
      }

      .notification.success .notification-progress-bar {
        color: #28a745;
      }

      .notification.error .notification-progress-bar {
        color: #dc3545;
      }

      .notification.warning .notification-progress-bar {
        color: #ffc107;
      }

      .notification.info .notification-progress-bar {
        color: #17a2b8;
      }

      @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
      }

      /* Thème sombre */
      :root.theme-dark .notification {
        background: var(--bg-secondary, #2d2d2d);
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }

      :root.theme-dark .notification-title {
        color: var(--text-primary, #ffffff);
      }

      :root.theme-dark .notification-message {
        color: var(--text-secondary, #b0b0b0);
      }

      :root.theme-dark .notification-close {
        color: var(--text-secondary, #b0b0b0);
      }

      :root.theme-dark .notification-close:hover {
        color: var(--text-primary, #ffffff);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .notification-container {
          left: 20px;
          right: 20px;
          max-width: none;
        }

        .notification {
          min-width: auto;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Afficher une notification
   */
  show(options) {
    const {
      title = '',
      message = '',
      type = 'info', // success, error, warning, info
      duration = this.defaultDuration,
      persistent = false,
      native = false
    } = options;

    // Notification native du système (si disponible)
    if (native && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/assets/icon.png',
        badge: '/assets/icon.png'
      });
    }

    // Notification dans l'application
    const id = 'notif-' + Date.now() + Math.random();
    const notification = {
      id,
      title,
      message,
      type,
      duration,
      persistent
    };

    this.notifications.push(notification);

    // Limiter le nombre de notifications
    if (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.removeNotification(oldest.id);
    }

    // Créer l'élément
    this.createNotificationElement(notification);

    // Auto-suppression
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    return id;
  }

  /**
   * Créer l'élément de notification
   */
  createNotificationElement(notification) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };

    const element = document.createElement('div');
    element.id = notification.id;
    element.className = `notification ${notification.type}`;

    element.innerHTML = `
      <i class="bi ${icons[notification.type]} notification-icon"></i>
      <div class="notification-content">
        ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
        ${notification.message ? `<div class="notification-message">${notification.message}</div>` : ''}
      </div>
      <button class="notification-close" onclick="notificationManager.removeNotification('${notification.id}')">
        <i class="bi bi-x"></i>
      </button>
      ${!notification.persistent ? `
        <div class="notification-progress">
          <div class="notification-progress-bar" style="animation-duration: ${notification.duration}ms;"></div>
        </div>
      ` : ''}
    `;

    container.appendChild(element);
  }

  /**
   * Supprimer une notification
   */
  removeNotification(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add('removing');

    setTimeout(() => {
      element.remove();
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 300);
  }

  /**
   * Supprimer toutes les notifications
   */
  clearAll() {
    this.notifications.forEach(notif => {
      this.removeNotification(notif.id);
    });
  }

  /**
   * Raccourcis pour les types courants
   */
  success(title, message, options = {}) {
    return this.show({ ...options, title, message, type: 'success' });
  }

  error(title, message, options = {}) {
    return this.show({ ...options, title, message, type: 'error' });
  }

  warning(title, message, options = {}) {
    return this.show({ ...options, title, message, type: 'warning' });
  }

  info(title, message, options = {}) {
    return this.show({ ...options, title, message, type: 'info' });
  }

  /**
   * Notifications spécifiques pour les actions
   */
  folderCreated(folderName) {
    this.success(
      'Dossier créé',
      `Le dossier "${folderName}" a été créé avec succès.`,
      { native: true }
    );
  }

  folderDeleted(folderName) {
    this.warning(
      'Dossier supprimé',
      `Le dossier "${folderName}" a été supprimé.`,
      { native: true }
    );
  }

  folderRenamed(oldName, newName) {
    this.info(
      'Dossier renommé',
      `"${oldName}" → "${newName}"`,
      { native: true }
    );
  }

  fileUploaded(fileName) {
    this.success(
      'Fichier uploadé',
      `Le fichier "${fileName}" a été uploadé avec succès.`,
      { native: true }
    );
  }

  fileDeleted(fileName) {
    this.warning(
      'Fichier supprimé',
      `Le fichier "${fileName}" a été supprimé.`,
      { native: true }
    );
  }

  uploadProgress(current, total) {
    return this.info(
      'Upload en cours',
      `${current} sur ${total} fichiers uploadés...`,
      { persistent: true }
    );
  }

  uploadComplete(count) {
    this.success(
      'Upload terminé',
      `${count} fichier(s) uploadé(s) avec succès !`,
      { native: true, duration: 7000 }
    );
  }

  connectionLost() {
    this.error(
      'Connexion perdue',
      'La connexion au serveur a été perdue.',
      { persistent: true, native: true }
    );
  }

  connectionRestored() {
    this.success(
      'Connexion rétablie',
      'La connexion au serveur a été rétablie.',
      { native: true }
    );
  }
}

// Initialiser le gestionnaire de notifications
const notificationManager = new NotificationManager();

// Exposer globalement
window.notificationManager = notificationManager;
