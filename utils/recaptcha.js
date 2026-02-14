/**
 * Verify reCAPTCHA v3 server side.
 * @see https://developers.google.com/recaptcha/docs/v3
 */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a reCAPTCHA v3 token with Google.
 * @param {string} token - Token returned by the front (grecaptcha.execute).
 * @param {string} secretKey - reCAPTCHA secret key (RECAPTCHA_SECRET_KEY).
 * @param {string} [expectedAction] - Expected action (ex: "contact"). If provided, the response must match.
 * @param {number} [minScore=0.5] - Minimum score (0–1). Below this, considered as bot.
 * @returns {Promise<{ success: boolean, score?: number, action?: string, error?: string }>}
 */
async function verifyRecaptcha(token, secretKey, expectedAction = null, minScore = 0.5) {
  if (!token || !secretKey) {
    return { success: false, error: 'token_or_secret_missing' };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        error: (data['error-codes'] && data['error-codes'][0]) || 'verification_failed',
      };
    }

    if (expectedAction && data.action !== expectedAction) {
      return { success: false, error: 'action_mismatch', action: data.action };
    }

    const score = typeof data.score === 'number' ? data.score : 0;
    if (score < minScore) {
      return { success: false, error: 'score_too_low', score };
    }

    return { success: true, score: data.score, action: data.action };
  } catch (err) {
    return { success: false, error: err.message || 'request_failed' };
  }
}

module.exports = { verifyRecaptcha };
