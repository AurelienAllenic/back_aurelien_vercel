const mongoose = require('mongoose');

let aurelienConnection = null;

const connectDBAurelien = async () => {
    try {
        if (!process.env.MONGO_SECRET_KEY_AURELIEN) {
            console.warn('⚠️ MONGO_SECRET_KEY_AURELIEN non défini - connexion Aurelien ignorée');
            return null;
        }

        aurelienConnection = mongoose.createConnection(process.env.MONGO_SECRET_KEY_AURELIEN, {
            serverSelectionTimeoutMS: 10000, // ⚡ Réduit à 10s pour éviter les timeouts Vercel
            socketTimeoutMS: 8000, // ⚡ Réduit à 8s
            connectTimeoutMS: 10000, // ⚡ Réduit à 10s
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
        });

        // Attendre que la connexion soit prête
        await new Promise((resolve, reject) => {
            if (aurelienConnection.readyState === 1) {
                // Déjà connecté
                resolve();
            } else {
                aurelienConnection.once('connected', () => {
                    console.log('✅ Connexion à MongoDB Aurelien établie !');
                    resolve();
                });
                aurelienConnection.once('error', (err) => {
                    console.error('❌ Erreur de connexion à MongoDB Aurelien :', err);
                    reject(err);
                });
                // Timeout de sécurité
                setTimeout(() => {
                    if (aurelienConnection.readyState !== 1) {
                        reject(new Error('Timeout de connexion MongoDB Aurelien'));
                    }
                }, 10000);
            }
        });

        console.log('✅ Connexion à MongoDB Aurelien prête !');
        return aurelienConnection;
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB Aurelien :', error);
        aurelienConnection = null;
        // Ne pas faire process.exit pour ne pas bloquer l'app principale
        return null;
    }
};

const getAurelienConnection = () => {
    return aurelienConnection;
};

module.exports = { connectDBAurelien, getAurelienConnection };
