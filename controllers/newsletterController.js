const { Resend } = require("resend");
const Subscription = require("../models/Subscription");

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_NAME = process.env.SITE_NAME || "PARO";
const SENDER_EMAIL =
  process.env.SENDER_EMAIL || "contact@paro-musique.com";
const FRONTEND_URL =
  process.env.SITE_URL ||
  process.env.FRONTEND_URL ||
  "https://paro-musique.com";

/**
 * Gère l'abonnement à la newsletter et/ou à la mailing list.
 * On stocke les inscriptions dans MongoDB (modèle Subscription)
 * et on envoie un email de confirmation via Resend.
 */
exports.subscribeNewsletter = async (req, res) => {
  const { email, newsletter, mailingList } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "L'adresse email est requise",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Format d'email invalide",
    });
  }

  if (!newsletter && !mailingList) {
    return res.status(400).json({
      success: false,
      error:
        "Veuillez sélectionner au moins une option (newsletter ou mailing list)",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const subscribedTypes = [];

    // Helper pour créer / réactiver une inscription
    const upsertSubscription = async (type) => {
      const existing = await Subscription.findOne({
        email: normalizedEmail,
        type,
      });

      if (existing) {
        if (!existing.active) {
          existing.active = true;
          existing.unsubscribedAt = null;
          existing.subscribedAt = new Date();
          await existing.save();
        }
        return existing;
      }

      const sub = new Subscription({
        email: normalizedEmail,
        type,
        active: true,
        source: "site",
      });
      await sub.save();
      return sub;
    };

    if (newsletter) {
      await upsertSubscription("newsletter");
      subscribedTypes.push("newsletter");
    }

    if (mailingList) {
      await upsertSubscription("mailingList");
      subscribedTypes.push("mailingList");
    }

    // Construire le texte lisible pour l'email de confirmation
    const humanTypes = subscribedTypes
      .map((t) => (t === "newsletter" ? "Newsletter" : "Mailing list"))
      .join(" et ");

    // Liens de désinscription (un par type sélectionné)
    const unsubscribeLinks = subscribedTypes
      .map((t) => {
        const typeLabel = t === "newsletter" ? "newsletter" : "mailing list";
        const url = `${FRONTEND_URL.replace(
          /\/$/,
          ""
        )}/unsubscribe?email=${encodeURIComponent(
          normalizedEmail
        )}&type=${encodeURIComponent(t)}`;
        return `<li><a href="${url}" style="color:#667eea;text-decoration:underline;">Se désabonner de la ${typeLabel}</a></li>`;
      })
      .join("");

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
            ${SITE_NAME}
          </h1>
          <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
            Merci pour votre inscription !
          </p>
        </div>
        <div style="background: white; padding: 35px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
          <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin: 0 0 24px;">
            Bonjour,<br/>
            Votre adresse <strong>${normalizedEmail}</strong> a bien été inscrite à : <strong>${humanTypes}</strong>.
          </p>
          <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin: 0 0 24px;">
            Vous pourrez recevoir ponctuellement des actualités, annonces ou informations importantes.
          </p>
          <p style="color: #a0aec0; font-size: 13px; margin: 24px 0 8px;">
            Vous pouvez vous désabonner à tout moment :
          </p>
          <ul style="margin: 0; padding-left: 20px; color:#4a5568; font-size:14px;">
            ${unsubscribeLinks}
          </ul>
        </div>
        <div style="text-align: center; padding: 25px 20px;">
          <p style="color: #a0aec0; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} ${SITE_NAME} - Tous droits réservés
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: `${SITE_NAME} <${SENDER_EMAIL}>`,
        to: normalizedEmail,
        subject: "Inscription confirmée",
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("❌ Erreur Resend (newsletter):", emailError);
      // On ne bloque pas l'inscription si l'email de confirmation échoue
    }

    return res.status(200).json({
      success: true,
      message:
        "Inscription enregistrée avec succès. Vous recevrez bientôt nos actualités.",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription newsletter/mailing list:", error);
    return res.status(500).json({
      success: false,
      error:
        "Une erreur est survenue lors de l'inscription. Veuillez réessayer dans quelques instants.",
    });
  }
};

/**
 * Route de désinscription (appelée depuis le lien dans l'email).
 * Attend les query params: email, type ("newsletter" ou "mailingList").
 */
exports.unsubscribe = async (req, res) => {
  const { email, type } = req.query;

  if (!email || !type) {
    return res.status(400).send(
      "<h1>Paramètres manquants</h1><p>L'email ou le type d'inscription est manquant.</p>"
    );
  }

  if (!["newsletter", "mailingList"].includes(type)) {
    return res
      .status(400)
      .send("<h1>Type invalide</h1><p>Type d'inscription inconnu.</p>");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const sub = await Subscription.findOne({
      email: normalizedEmail,
      type,
      active: true,
    });

    if (!sub) {
      return res
        .status(200)
        .send(
          "<h1>Déjà désabonné</h1><p>Aucune inscription active trouvée pour cette adresse.</p>"
        );
    }

    sub.active = false;
    sub.unsubscribedAt = new Date();
    await sub.save();

    const label =
      type === "newsletter" ? "la newsletter" : "la mailing list";

    return res
      .status(200)
      .send(
        `<h1>Désabonnement pris en compte</h1><p>Votre adresse a été retirée de ${label}.</p>`
      );
  } catch (error) {
    console.error("❌ Erreur lors de la désinscription:", error);
    return res
      .status(500)
      .send(
        "<h1>Erreur serveur</h1><p>Une erreur est survenue lors de la désinscription. Veuillez réessayer plus tard.</p>"
      );
  }
};

/**
 * Liste des abonnés (backoffice).
 * Optionnel: requête ?type=newsletter ou ?type=mailingList
 */
exports.getSubscriptions = async (req, res) => {
  const { type } = req.query;

  const filter = {};
  if (type && ["newsletter", "mailingList"].includes(type)) {
    filter.type = type;
  }

  try {
    const subscriptions = await Subscription.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des abonnés:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des abonnés",
    });
  }
};

/**
 * Ajouter un abonné (backoffice, auth).
 * Body: { email, type? } avec type "newsletter" | "mailingList"
 *   ou { email, newsletter?, mailingList? } (booléens, au moins un à true)
 */
exports.addSubscriber = async (req, res) => {
  const { email, type, newsletter, mailingList } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      error: "L'adresse email est requise",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: "Format d'email invalide",
    });
  }

  const typesToAdd = [];
  if (type && ["newsletter", "mailingList"].includes(type)) {
    typesToAdd.push(type);
  } else {
    if (newsletter) typesToAdd.push("newsletter");
    if (mailingList) typesToAdd.push("mailingList");
  }

  if (typesToAdd.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Indiquez au moins un type : type (newsletter | mailingList) ou newsletter / mailingList à true",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const created = [];

    for (const t of typesToAdd) {
      let sub = await Subscription.findOne({
        email: normalizedEmail,
        type: t,
      });
      if (sub) {
        sub.active = true;
        sub.unsubscribedAt = null;
        sub.subscribedAt = new Date();
        sub.source = "backoffice";
        await sub.save();
        created.push(sub);
      } else {
        sub = new Subscription({
          email: normalizedEmail,
          type: t,
          active: true,
          source: "backoffice",
        });
        await sub.save();
        created.push(sub);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Abonné(s) ajouté(s) ou réactivé(s)",
      data: created,
    });
  } catch (error) {
    console.error("❌ Erreur addSubscriber:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout de l'abonné",
    });
  }
};

/**
 * Supprimer un abonné (backoffice, auth).
 * Param : id = _id du document Subscription
 */
exports.deleteSubscriber = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await Subscription.findByIdAndDelete(id);
    if (!sub) {
      return res.status(404).json({
        success: false,
        error: "Abonnement introuvable",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Abonnement supprimé",
    });
  } catch (error) {
    console.error("❌ Erreur deleteSubscriber:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression",
    });
  }
};

/**
 * Activer ou désactiver un abonné (backoffice, auth).
 * PATCH /subscriptions/:id
 * Body: { active: true | false }
 */
exports.setSubscriberActive = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "Le champ active (true ou false) est requis",
    });
  }

  try {
    const sub = await Subscription.findByIdAndUpdate(
      id,
      {
        active,
        ...(active ? { unsubscribedAt: null, subscribedAt: new Date() } : { unsubscribedAt: new Date() }),
      },
      { new: true, runValidators: true }
    );
    if (!sub) {
      return res.status(404).json({
        success: false,
        error: "Abonnement introuvable",
      });
    }
    return res.status(200).json({
      success: true,
      message: sub.active ? "Abonné activé" : "Abonné désactivé",
      data: sub,
    });
  } catch (error) {
    console.error("❌ Erreur setSubscriberActive:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour",
    });
  }
};

