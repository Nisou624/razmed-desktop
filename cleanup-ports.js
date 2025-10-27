const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour tuer les processus sur un port spécifique
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`🔍 Recherche de processus sur le port ${port}...`);
    
    let command;
    if (process.platform === 'win32') {
      // Windows
      command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`;
    } else {
      // Linux/macOS
      command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`ℹ️  Aucun processus trouvé sur le port ${port}`);
      } else {
        console.log(`✅ Processus tué sur le port ${port}`);
      }
      resolve();
    });
  });
}

// Nettoyer les ports couramment utilisés
async function cleanupPorts() {
  console.log('🧹 Nettoyage des ports...');
  
  const ports = [3001, 3002, 3003, 3004, 3005];
  
  for (const port of ports) {
    await killProcessOnPort(port);
  }
  
  // Supprimer le fichier de port
  const portFile = path.join(__dirname, 'server-port.txt');
  if (fs.existsSync(portFile)) {
    fs.unlinkSync(portFile);
    console.log('✅ Fichier de port supprimé');
  }
  
  console.log('✅ Nettoyage terminé');
}

// Exécuter le nettoyage si appelé directement
if (require.main === module) {
  cleanupPorts().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur nettoyage:', error);
    process.exit(1);
  });
}

module.exports = { killProcessOnPort, cleanupPorts };

