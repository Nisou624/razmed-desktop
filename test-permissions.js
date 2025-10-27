/**
 * Script de test pour vérifier les permissions de fichiers
 */

const http = require('http');
const path = require('path');

console.log('🧪 Test des permissions de fichiers\n');

// Configuration
const HOST = 'localhost';
const PORT = 3001;

// Fonction pour faire une requête HTTP
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Tests
async function runTests() {
  console.log('📋 Tests de permissions des fichiers\n');
  console.log('='.
