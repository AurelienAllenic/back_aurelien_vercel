const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

if (!process.env.MESSAGE_ENCRYPTION_KEY) {
  console.warn('⚠️ [Encryption] MESSAGE_ENCRYPTION_KEY non défini ! Une clé aléatoire est utilisée.');
  console.warn('⚠️ [Encryption] Les messages chiffrés ne pourront pas être déchiffrés après redémarrage.');
} else {
  const keyPreview = process.env.MESSAGE_ENCRYPTION_KEY.substring(0, 10) + '...' + process.env.MESSAGE_ENCRYPTION_KEY.substring(process.env.MESSAGE_ENCRYPTION_KEY.length - 10);
  console.log('✅ [Encryption] MESSAGE_ENCRYPTION_KEY défini, aperçu:', keyPreview);
}

/**
 * Encrypt a text with AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in base64 format
 */
function encrypt(text) {
  if (!text) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64'),
    ]);
    return combined.toString('base64');
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement:', error);
    throw new Error('Erreur lors du chiffrement du message');
  }
}

/**
 * Decrypt a encrypted text with AES-256-GCM
 * @param {string} encryptedText - Encrypted text in base64 format
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  try {
    const combined = Buffer.from(encryptedText, 'base64');
    const minSize = SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
    if (combined.length < minSize) {
      console.warn('⚠️ [Decrypt] Texte trop court pour être déchiffré (taille:', combined.length, 'min:', minSize, ')');
      return encryptedText;
    }
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
      console.error('❌ [Decrypt] MESSAGE_ENCRYPTION_KEY non défini ou trop court');
      return encryptedText;
    }
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement:', error.message);
    return encryptedText;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
