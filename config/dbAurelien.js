const mongoose = require('mongoose');

let aurelienConnection = null;

let connectionPromise = null;

const connectDBAurelien = async () => {
    // Si une connexion est déjà en cours, attendre celle-ci
    if (connectionPromise) {
        return connectionPromise;
    }

    // Si déjà connecté, retourner la connexion
    if (aurelienConnection && aurelienConnection.readyState === 1) {
        return aurelienConnection;
    }

    connectionPromise = (async () => {
        try {
            if (!process.env.MONGO_SECRET_KEY_AURELIEN) {
                console.warn('⚠️ MONGO_SECRET_KEY_AURELIEN non défini - connexion Aurelien ignorée');
                return null;
            }

            const mongoUri = process.env.MONGO_SECRET_KEY_AURELIEN;
            
            // Log de l'URI (masquer le mot de passe pour la sécurité)
            const uriForLog = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
            console.log('🔌 [Aurelien] Tentative de connexion à:', uriForLog);
            
            // Si une connexion existe mais n'est pas prête, la fermer d'abord
            if (aurelienConnection && aurelienConnection.readyState !== 0) {
                console.log('🔄 [Aurelien] Fermeture de l\'ancienne connexion...');
                await aurelienConnection.close();
            }
            
            aurelienConnection = mongoose.createConnection(mongoUri, {
                serverSelectionTimeoutMS: 8000, // ⚡ 8s max pour éviter les timeouts Vercel
                socketTimeoutMS: 10000,
                connectTimeoutMS: 8000,
                maxPoolSize: 5,
                minPoolSize: 1,
                maxIdleTimeMS: 30000,
            });

            // Utiliser asPromise() qui est plus fiable que les événements
            console.log('🔄 [Aurelien] Attente de la connexion...');
            await aurelienConnection.asPromise();
            
            console.log('✅ [Aurelien] Connexion à MongoDB Aurelien établie et prête !');
            console.log('✅ [Aurelien] État de la connexion:', {
              0: 'disconnected',
              1: 'connected',
              2: 'connecting',
              3: 'disconnecting'
            }[aurelienConnection.readyState] || 'unknown');
            connectionPromise = null; // Réinitialiser pour permettre de nouvelles tentatives
            return aurelienConnection;
        } catch (error) {
            console.error('❌ Erreur de connexion à MongoDB Aurelien :', error.message);
            if (error.stack) {
                console.error('❌ Stack:', error.stack.substring(0, 500)); // Limiter la taille du log
            }
            aurelienConnection = null;
            connectionPromise = null; // Réinitialiser pour permettre de nouvelles tentatives
            // Ne pas faire process.exit pour ne pas bloquer l'app principale
            return null;
        }
    })();

    return connectionPromise;
};

const getAurelienConnection = () => {
    return aurelienConnection;
};

module.exports = { connectDBAurelien, getAurelienConnection };
