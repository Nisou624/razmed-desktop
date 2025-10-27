const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'public/assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#667eea'
  });

  // Attendre que la fenêtre soit prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Charger l'application
  mainWindow.loadURL('http://localhost:3001');

  // Ouvrir les DevTools en mode développement
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Empêcher la navigation externe
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:3001')) {
      event.preventDefault();
    }
  });
}

// Démarrer le serveur Node.js
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server', 'server.js');
    serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit'
    });

    serverProcess.on('error', (error) => {
      console.error('Erreur serveur:', error);
      reject(error);
    });

    // Attendre que le serveur soit prêt
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

// Arrêter le serveur
function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// Quand Electron est prêt
app.whenReady().then(async () => {
  try {
    // Démarrer le serveur
    await startServer();
    
    // Créer la fenêtre
    createWindow();
  } catch (error) {
    console.error('Erreur au démarrage:', error);
    app.quit();
  }
});

// Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Sur macOS, recréer la fenêtre quand l'icône du dock est cliquée
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Nettoyer avant de quitter
app.on('before-quit', () => {
  stopServer();
});

// Gérer les IPC messages (si nécessaire)
ipcMain.on('app-quit', () => {
  app.quit();
});
