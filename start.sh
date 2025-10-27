#!/bin/bash

echo "========================================"
echo " SNTP Document Portal - Démarrage"
echo "========================================"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installé !"
    echo "Téléchargez-le depuis https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js détecté"
node --version
echo ""

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installation des dépendances..."
    echo "Cela peut prendre quelques minutes..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERREUR] Échec de l'installation des dépendances"
        exit 1
    fi
    echo "[OK] Dépendances installées"
    echo ""
fi

# Créer le dossier uploads s'il n'existe pas
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo "[OK] Dossier uploads créé"
fi

echo "[INFO] Démarrage de l'application..."
echo ""
echo "L'application va s'ouvrir dans quelques secondes..."
echo "Pour arrêter l'application, fermez cette fenêtre ou appuyez sur Ctrl+C"
echo ""

# Démarrer l'application
npm start
