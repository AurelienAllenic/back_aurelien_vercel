const brevo = require('@getbrevo/brevo');

// Initialiser l'API Brevo pour les contacts
const contactsApi = new brevo.ContactsApi();
contactsApi.setApiKey(
  brevo.ContactsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Gère l'abonnement à la newsletter et/ou mailing list
 */
exports.subscribeNewsletter = async (req, res) => {
  const { email, newsletter, mailingList } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'L\'adresse email est requise'
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

  // Vérifier qu'au moins une option est sélectionnée
  if (!newsletter && !mailingList) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez sélectionner au moins une option (newsletter ou mailing list)'
    });
  }

  try {
    // IDs des listes Brevo (à configurer dans votre .env)
    const newsletterListId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '0');
    const mailingListId = parseInt(process.env.BREVO_MAILING_LIST_ID || '0');

    // Préparer les listes d'abonnement
    const listIds = [];
    if (newsletter && newsletterListId > 0) {
      listIds.push(newsletterListId);
    }
    if (mailingList && mailingListId > 0) {
      listIds.push(mailingListId);
    }

    if (listIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune liste configurée. Veuillez configurer les IDs des listes dans le backend.'
      });
    }

    // Créer ou mettre à jour le contact dans Brevo
    const createContact = new brevo.CreateContact();
    createContact.email = email.trim();
    createContact.listIds = listIds;
    createContact.updateEnabled = true; // Mettre à jour si le contact existe déjà

    // Ajouter des attributs optionnels
    createContact.attributes = {
      NEWSLETTER: newsletter || false,
      MAILING_LIST: mailingList || false,
      SUBSCRIBED_AT: new Date().toISOString()
    };

    await contactsApi.createContact(createContact);

    console.log(`✅ Contact ${email} ajouté aux listes: ${listIds.join(', ')}`);

    res.status(200).json({
      success: true,
      message: 'Abonnement réussi ! Vous recevrez bientôt nos actualités.'
    });

  } catch (error) {
    console.error('❌ Erreur Brevo lors de l\'abonnement:', error);
    
    // Gérer les erreurs spécifiques de Brevo
    if (error.response) {
      const errorBody = error.response.body;
      
      // Contact déjà existant - considérer comme succès
      if (errorBody.code === 'duplicate_parameter') {
        // Mettre à jour le contact existant
        try {
          const updateContact = new brevo.UpdateContact();
          updateContact.listIds = listIds;
          updateContact.attributes = {
            NEWSLETTER: newsletter || false,
            MAILING_LIST: mailingList || false,
            UPDATED_AT: new Date().toISOString()
          };

          await contactsApi.updateContact(email, updateContact);
          
          console.log(`✅ Contact ${email} mis à jour dans les listes: ${listIds.join(', ')}`);
          
          return res.status(200).json({
            success: true,
            message: 'Abonnement mis à jour avec succès !'
          });
        } catch (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: errorBody.message || 'Erreur lors de l\'abonnement'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de l\'abonnement. Veuillez réessayer dans quelques instants.'
    });
  }
};
