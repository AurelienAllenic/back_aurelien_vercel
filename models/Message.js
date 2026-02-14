const mongoose = require('mongoose');
const connectDB = require('../config/db');

const messageSchemaDefinition = {
  email: { type: String, required: true },
  message: { type: String, required: true },
  send: { type: Boolean, default: false },
  error: { type: String, default: null },
};

const getMessageModel = async () => {
  let connection = mongoose.connection;

  if (!connection || connection.readyState !== 1) {
    await connectDB();
    connection = mongoose.connection;
    if (connection.readyState === 2) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 60;
        const checkConnection = setInterval(() => {
          attempts++;
          const state = connection.readyState;
          if (state === 1 || state === 0 || attempts >= maxAttempts) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }
  }

  if (connection && connection.readyState === 1) {
    if (connection.models.Message) {
      return connection.models.Message;
    }
    const schema = new mongoose.Schema(messageSchemaDefinition, { timestamps: true });
    return connection.model('Message', schema);
  }

  console.warn('⚠️ [Message] Connexion non disponible (readyState:', connection?.readyState, ')');
  return null;
};

module.exports = getMessageModel;
