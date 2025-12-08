const brevo = require('@getbrevo/brevo');

// Initialiser l'API Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey, 
  process.env.BREVO_API_KEY
);

/**
 * Gère l'envoi d'emails depuis le formulaire de contact PARO
 */
exports.handleParoContact = async (req, res) => {
  const { name, email, tel, age, sexe, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nom, email et message sont requis' 
    });
  }

  // Validation email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Format d\'email invalide' 
    });
  }

  try {
    // 1️⃣ Email pour vous (admin PARO)
    const adminEmail = {
      sender: { 
        email: 'Paro.musique.mgmt@gmail.com', 
        name: 'PARO Contact Form' 
      },
      to: [{ 
        email: process.env.PARO_ADMIN_EMAIL || 'contact@paro-musique.com'
      }],
      replyTo: { 
        email: email, 
        name: name 
      },
      subject: `[PARO] Nouveau contact de ${name}`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #f8f9fa;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
              🎵 PARO
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Nouveau message depuis le formulaire de contact
            </p>
          </div>
          
          <!-- Body -->
          <div style="background: white; padding: 35px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 12px;">
              📋 Informations du contact
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
              <tr style="background: #f7fafc;">
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #4a5568; width: 35%;">
                  👤 Nom
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                  ${name}
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #4a5568;">
                  📧 Email
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                  <a href="mailto:${email}" style="color: #667eea; text-decoration: none; font-weight: 500;">
                    ${email}
                  </a>
                </td>
              </tr>
              <tr style="background: #f7fafc;">
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #4a5568;">
                  📱 Téléphone
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                  ${tel || '<em style="color: #a0aec0;">Non renseigné</em>'}
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #4a5568;">
                  🎂 Âge
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                  ${age || '<em style="color: #a0aec0;">Non renseigné</em>'}
                </td>
              </tr>
              <tr style="background: #f7fafc;">
                <td style="padding: 15px; font-weight: 600; color: #4a5568;">
                  ⚧ Sexe
                </td>
                <td style="padding: 15px; color: #2d3748;">
                  ${sexe || '<em style="color: #a0aec0;">Non renseigné</em>'}
                </td>
              </tr>
            </table>
            
            <div style="background: linear-gradient(to right, #f7fafc, #edf2f7); padding: 25px; border-radius: 8px; border-left: 5px solid #667eea; margin: 30px 0;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                💬 Message
              </h3>
              <p style="white-space: pre-wrap; line-height: 1.8; color: #4a5568; margin: 0; font-size: 15px;">
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0 25px 0;">
              <a href="mailto:${email}?subject=Re: Votre message sur PARO" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 14px 35px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600;
                        font-size: 16px;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                ✉️ Répondre à ${name}
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e2e8f0; margin-top: 30px;">
              <p style="color: #a0aec0; font-size: 13px; margin: 0;">
                📅 Reçu le ${new Date().toLocaleString('fr-FR', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
          </div>
          
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(adminEmail);
    console.log(`✅ Email admin PARO envoyé pour ${name}`);

    // 2️⃣ Email de confirmation pour le visiteur
    const confirmationEmail = {
      sender: { 
        email: 'Paro.musique.mgmt@gmail.com', 
        name: 'PARO' 
      },
      to: [{ 
        email: email, 
        name: name 
      }],
      subject: 'Message bien reçu ! 🎵',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
              🎵 PARO
            </h1>
            <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
              Merci de nous avoir contactés !
            </p>
          </div>
          
          <!-- Body -->
          <div style="background: white; padding: 35px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            
            <h2 style="color: #2d3748; font-size: 24px; margin-top: 0;">
              Bonjour ${name} ! 👋
            </h2>
            
            <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin: 20px 0;">
              Nous avons bien reçu votre message et nous vous en remercions sincèrement. 
              Notre équipe vous répondra dans les plus brefs délais.
            </p>
            
            <div style="background: linear-gradient(to right, #f7fafc, #edf2f7); padding: 25px; border-radius: 8px; border-left: 5px solid #667eea; margin: 30px 0;">
              <p style="margin: 0 0 8px 0; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                📝 Récapitulatif de votre message
              </p>
              <p style="white-space: pre-wrap; color: #2d3748; margin: 0; line-height: 1.7; font-size: 15px;">
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin: 25px 0;">
              En attendant notre réponse, n'hésitez pas à découvrir nos dernières actualités sur 
              <a href="https://paro-musique.com" 
                 style="color: #667eea; text-decoration: none; font-weight: 600; border-bottom: 2px solid #667eea;">
                paro-musique.com
              </a>
            </p>
            
            <!-- Signature -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; font-size: 16px; margin: 8px 0;">
                🎵 À très bientôt !
              </p>
              <p style="color: #2d3748; font-weight: 700; font-size: 18px; margin: 8px 0;">
                L'équipe PARO
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 25px 20px;">
            <p style="color: #a0aec0; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} PARO - Tous droits réservés
            </p>
          </div>
          
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(confirmationEmail);
    console.log(`✅ Email confirmation envoyé à ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons rapidement.' 
    });

  } catch (error) {
    console.error('❌ Erreur Brevo:', error);
    
    // Log détaillé pour debug
    if (error.response) {
      console.error('Détails:', error.response.body);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer dans quelques instants.' 
    });
  }
};