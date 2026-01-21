const mongoose = require('mongoose');

let aurelienConnection = null;

const connectDBAurelien = async () => {
    try {
        if (!process.env.MONGO_SECRET_KEY_AURELIEN) {
            console.warn('⚠️ MONGO_SECRET_KEY_AURELIEN non défini - connexion Aurelien ignorée');
            return null;
        }

        // Vérifier si l'URI contient déjà des options SSL
        const mongoUri = process.env.MONGO_SECRET_KEY_AURELIEN;
        
        aurelienConnection = mongoose.createConnection(mongoUri, {
            serverSelectionTimeoutMS: 15000, // ⚡ Augmenté à 15s pour MongoDB Atlas
            socketTimeoutMS: 45000, // ⚡ Augmenté pour MongoDB Atlas
            connectTimeoutMS: 15000, // ⚡ Augmenté à 15s
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            // Options SSL/TLS pour MongoDB Atlas
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            retryWrites: true,
            retryReads: true,
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
