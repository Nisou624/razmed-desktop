/**
 * Script de test pour vérifier que l'application fonctionne correctement
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Test de l\'application SNTP Document Portal\n');

// Vérifications préalables
console.log('📋 Vérifications préalables...\n');

// 1. Vérifier Node.js version
const nodeVersion = process.version;
console.log(`✓ Node.js version: ${nodeVersion}`);

const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.error('❌ ERREUR: Node.js 18 ou supérieur est requis');
  process.exit(1);
}

// 2. Vérifier node_modules
if (!fs.existsSync('./node_modules')) {
  console.error('❌ ERREUR: node_modules n\'existe pas. Exécutez: npm install');
  process.exit(1);
}
console.log('✓ node_modules trouvé');

// 3. Vérifier les dossiers requis
const requiredDirs = ['server', 'public', 'uploads'];
for (const dir of requiredDirs) {
  if (!fs.existsSync(`./${dir}`)) {
    console.log(`⚠️  Dossier manquant: ${dir} - Création...`);
    fs.mkdirSync(`./${dir}`, { recursive: true });
  }
  console.log(`✓ Dossier ${dir}/ existe`);
}

// 4. Vérifier les fichiers requis
const requiredFiles = [
  'electron.js',
  'preload.js',
  'server/server.js',
  'server/database.js',
  'public/index.html',
  'public/js/app.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(`./${file}`)) {
    console.error(`❌ ERREUR: Fichier manquant: ${file}`);
    process.exit(1);
  }
  console.log(`✓ ${file} existe`);
}

// 5. Vérifier package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log(`✓ package.json valide - Version ${packageJson.version}`);
} catch (error) {
  console.error('❌ ERREUR: package.json invalide');
  process.exit(1);
}

// 6. Vérifier les dépendances critiques
const criticalDeps = ['express', 'sqlite3', 'electron', 'bcryptjs'];
console.log('\n📦 Vérification des dépendances critiques...\n');

for (const dep of criticalDeps) {
  try {
    require.resolve(dep);
    console.log(`✓ ${dep} installé`);
  } catch (error) {
    console.error(`❌ ERREUR: ${dep} n'est pas installé`);
    console.log(`   Exécutez: npm install ${dep}`);
    process.exit(1);
  }
}

// 7. Test de la base de données
console.log('\n💾 Test de la base de données...\n');

const { db, run, get, all } = require('./server/database');

setTimeout(async () => {
  try {
    // Vérifier la structure des tables
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('✓ Base de données connectée');
    console.log(`✓ ${tables.length} table(s) trouvée(s): ${tables.map(t => t.name).join(', ')}`);

    // Vérifier les données
    const admins = await all('SELECT * FROM admins');
    const folders = await all('SELECT * FROM folders');
    const files = await all('SELECT * FROM files');

    console.log(`✓ ${admins.length} administrateur(s)`);
    console.log(`✓ ${folders.length} dossier(s)`);
    console.log(`✓ ${files.length} fichier(s)`);

    // 8. Test du serveur (optionnel - ne démarre que si on le veut)
    console.log('\n🌐 Informations du serveur...\n');
    console.log('ℹ️  Le serveur se lance sur le port 3001');
    console.log('ℹ️  URL: http://localhost:3001');
    
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    console.log('\n🚀 Pour démarrer l\'application, exécutez: npm start');
    
    db.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERREUR lors du test de la base de données:', error);
    db.close();
    process.exit(1);
  }
}, 1000); // Attendre que la DB soit initialisée

// Note: Le timeout permet à database.js d'initialiser la DB avant les tests
