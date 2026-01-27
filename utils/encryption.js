const crypto = require('crypto');

// Clé de chiffrement (doit être dans les variables d'environnement)
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Longueur du vecteur d'initialisation
const SALT_LENGTH = 64; // Longueur du sel
const TAG_LENGTH = 16; // Longueur du tag d'authentification

// Log au démarrage pour vérifier la clé
if (!process.env.MESSAGE_ENCRYPTION_KEY) {
  console.warn('⚠️ [Encryption] MESSAGE_ENCRYPTION_KEY non défini ! Une clé aléatoire est utilisée.');
  console.warn('⚠️ [Encryption] Les messages chiffrés ne pourront pas être déchiffrés après redémarrage.');
  console.warn('⚠️ [Encryption] Clé aléatoire générée (premiers 20 caractères):', ENCRYPTION_KEY.substring(0, 20));
} else {
  const keyPreview = process.env.MESSAGE_ENCRYPTION_KEY.substring(0, 10) + '...' + process.env.MESSAGE_ENCRYPTION_KEY.substring(process.env.MESSAGE_ENCRYPTION_KEY.length - 10);
}

/**
 * Chiffre un texte avec AES-256-GCM
 * @param {string} text - Texte à chiffrer
 * @returns {string} - Texte chiffré au format base64
 */
function encrypt(text) {
  if (!text) return text;
  
  try {
    // Générer un vecteur d'initialisation aléatoire
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Générer un sel aléatoire
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Dériver la clé à partir de la clé principale et du sel
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Chiffrer le texte
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Récupérer le tag d'authentification
    const tag = cipher.getAuthTag();
    
    // Combiner: salt + iv + tag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    // Retourner en base64
    return combined.toString('base64');
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement:', error);
    throw new Error('Erreur lors du chiffrement du message');
  }
}

/**
 * Déchiffre un texte chiffré avec AES-256-GCM
 * @param {string} encryptedText - Texte chiffré au format base64
 * @returns {string} - Texte déchiffré
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  try {
    // Décoder le base64
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Vérifier que la taille est suffisante
    const minSize = SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
    if (combined.length < minSize) {
      console.warn('⚠️ [Decrypt] Texte trop court pour être déchiffré (taille:', combined.length, 'min:', minSize, ')');
      return encryptedText; // Probablement un ancien message non chiffré
    }
    
    // Vérifier que ENCRYPTION_KEY est défini
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
      console.error('❌ [Decrypt] MESSAGE_ENCRYPTION_KEY non défini ou trop court');
      return encryptedText;
    }
    
    // Extraire les composants
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Dériver la clé à partir de la clé principale et du sel
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Déchiffrer le texte
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement:', error.message);
    console.error('❌ [Decrypt] Texte chiffré (premiers 100 caractères):', encryptedText.substring(0, 100));
    // Si le déchiffrement échoue, retourner le texte original (pour compatibilité avec anciens messages)
    return encryptedText;
  }
}

module.exports = {
  encrypt,
  decrypt
};
