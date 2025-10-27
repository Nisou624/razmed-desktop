const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let serverProcess;
let serverPort = 3001;

// Fonction simple pour attendre le serveur
function waitForServer(port, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      console.log(`🔍 Tentative ${attempts}/${maxAttempts} - Vérification serveur port ${port}`);
      
      if (attempts > maxAttempts) {
        reject(new Error(`Serveur non disponible après ${maxAttempts} tentatives`));
        return;
      }
      
      const request = http.get(`http://localhost:${port}/api/health`, {
        timeout: 2000
      }, (res) => {
        console.log(`✅ Serveur répond (status: ${res.statusCode})`);
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(checkServer, 1000);
        }
      });
      
      request.on('error', (err) => {
        console.log(`⏳ Serveur pas encore prêt (${err.code}), nouvelle tentative...`);
        setTimeout(checkServer, 1000);
      });
      
      request.on('timeout', () => {
        console.log('⏳ Timeout, nouvelle tentative...');
        request.destroy();
        setTimeout(checkServer, 1000);
      });
    };
    
    checkServer();
  });
}

// Lire le port du serveur
function getServerPort() {
  const portFile = path.join(__dirname, 'server-port.txt');
  
  try {
    if (fs.existsSync(portFile)) {
      const port = parseInt(fs.readFileSync(portFile, 'utf8').trim());
      if (port && port > 0) {
        console.log(`📖 Port lu depuis fichier: ${port}`);
        return port;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lecture port:', error);
  }
  
  console.log('📖 Utilisation port par défaut: 3001');
  return 3001;
}

// Démarrer le serveur Node.js
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du serveur Node.js...');
    
    const serverScript = path.join(__dirname, 'server', 'server.js');
    
    if (!fs.existsSync(serverScript)) {
      reject(new Error(`Script serveur non trouvé: ${serverScript}`));
      return;
    }
    
    serverProcess = spawn('node', [serverScript], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    let serverStarted = false;
    let startupTimeout;

    // Timeout de sécurité
    startupTimeout = setTimeout(() => {
      if (!serverStarted) {
        console.log('⏰ Timeout atteint, tentative de connexion...');
        serverPort = getServerPort();
        resolve();
      }
    }, 15000);

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📊 Serveur:', output.trim());
      
      // Détecter le démarrage du serveur
      if (output.includes('Serveur démarré sur') && !serverStarted) {
        serverStarted = true;
        clearTimeout(startupTimeout);
        
        // Extraire le port
        const portMatch = output.match(/localhost:(\d+)/);
        if (portMatch) {
          serverPort = parseInt(portMatch[1]);
        }
        
        console.log(`✅ Serveur détecté sur le port ${serverPort}`);
        setTimeout(resolve, 2000); // Attendre 2s pour que le serveur soit stable
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('❌ Erreur serveur:', error.trim());
      
      // Ne pas rejeter pour les warnings, seulement pour les erreurs critiques
      if (error.includes('EADDRINUSE') || error.includes('Cannot find module')) {
        if (!serverStarted) {
          clearTimeout(startupTimeout);
          reject(new Error(`Erreur serveur: ${error}`));
        }
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Erreur spawn serveur:', error);
      if (!serverStarted) {
        clearTimeout(startupTimeout);
        reject(error);
      }
    });

    serverProcess.on('exit', (code) => {
      console.log(`🛑 Serveur fermé avec le code: ${code}`);
      if (code !== 0 && !serverStarted) {
        clearTimeout(startupTimeout);
        reject(new Error(`Serveur fermé avec le code ${code}`));
      }
    });
  });
}

// Créer la fenêtre Electron
function createWindow() {
  console.log('🪟 Création de la fenêtre Electron...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Temporairement pour éviter les problèmes CORS
    },
    title: 'SNTP - Portail Document',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Page de chargement simple
  const loadingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SNTP - Chargement</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          text-align: center;
        }
        .loader {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .details {
          font-size: 14px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <div class="spinner"></div>
        <div class="status">Démarrage du serveur...</div>
        <div class="details">Veuillez patienter</div>
      </div>
      
      <script>
        let attempts = 0;
        const maxAttempts = 60;
        
        function updateStatus(message, details = '') {
          document.querySelector('.status').textContent = message;
          document.querySelector('.details').textContent = details;
        }
        
        function checkServer() {
          attempts++;
          updateStatus('Connexion au serveur...', \`Tentative \${attempts}/\${maxAttempts}\`);
          
          fetch('/api/health')
            .then(response => {
              if (response.ok) {
                updateStatus('Serveur prêt !', 'Redirection...');
                setTimeout(() => {
                  window.location.href = '/';
                }, 1000);
              } else {
                throw new Error('Serveur pas prêt');
              }
            })
            .catch(() => {
              if (attempts < maxAttempts) {
                setTimeout(checkServer, 1000);
              } else {
                updateStatus('Erreur de connexion', 'Veuillez redémarrer l\\'application');
              }
            });
        }
        
        // Commencer les vérifications après 3 secondes
        setTimeout(checkServer, 3000);
      </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingHTML));
  mainWindow.show();

  // Fonction pour charger l'application finale
  async function loadMainApp() {
    try {
      console.log('🔄 Attente du serveur...');
      
      // Attendre que le serveur soit prêt
      await waitForServer(serverPort);
      
      console.log('🌐 Chargement de l\'application...');
      
      // Charger l'application principale
      await mainWindow.loadURL(`http://localhost:${serverPort}`);
      
      console.log('✅ Application chargée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur chargement application:', error);
      
      // Charger une page d'erreur
      const errorHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SNTP - Erreur</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              text-align: center;
            }
            .error-container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            .error-title {
              color: #e74c3c;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .error-message {
              color: #666;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            .retry-button {
              background: #3498db;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            .retry-button:hover {
              background: #2980b9;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-title">Erreur de connexion</div>
            <div class="error-message">
              Impossible de se connecter au serveur.<br>
              Vérifiez que Node.js est installé et redémarrez l'application.
            </div>
            <button class="retry-button" onclick="location.reload()">Réessayer</button>
          </div>
        </body>
        </html>
      `;
      
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHTML));
    }
  }

  // Charger l'app après un délai
  setTimeout(loadMainApp, 5000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Gestion des liens externes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Événements de l'application
app.whenReady().then(async () => {
  try {
    console.log('🎯 Electron prêt, démarrage...');
    
    // Démarrer le serveur
    await startServer();
    
    // Obtenir le port final
    serverPort = getServerPort();
    
    // Créer la fenêtre
    createWindow();
    
  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    
    dialog.showErrorBox(
      'Erreur de démarrage',
      `Impossible de démarrer l'application:\n${error.message}`
    );
    
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('🛑 Fermeture application...');
  
  if (serverProcess && !serverProcess.killed) {
    console.log('🛑 Arrêt du serveur...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 3000);
  }
  
  // Nettoyer le fichier de port
  const portFile = path.join(__dirname, 'server-port.txt');
  if (fs.existsSync(portFile)) {
    fs.unlinkSync(portFile);
  }
});

