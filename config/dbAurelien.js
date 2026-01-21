const mongoose = require('mongoose');

let aurelienConnection = null;

const connectDBAurelien = async () => {
    try {
        if (!process.env.MONGO_SECRET_KEY_AURELIEN) {
            console.warn('⚠️ MONGO_SECRET_KEY_AURELIEN non défini - connexion Aurelien ignorée');
            return null;
        }

        aurelienConnection = mongoose.createConnection(process.env.MONGO_SECRET_KEY_AURELIEN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // ⚡ Réduit à 10s pour éviter les timeouts Vercel
            socketTimeoutMS: 8000, // ⚡ Réduit à 8s
            connectTimeoutMS: 10000, // ⚡ Réduit à 10s
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            bufferCommands: false,
            bufferMaxEntries: 0,
        });

        console.log('✅ Connexion à MongoDB Aurelien réussie !');
        return aurelienConnection;
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB Aurelien :', error);
        // Ne pas faire process.exit pour ne pas bloquer l'app principale
        return null;
    }
};

const getAurelienConnection = () => {
    return aurelienConnection;
};

module.exports = { connectDBAurelien, getAurelienConnection };
