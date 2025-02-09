const sendEmail = require("../config/mailer");

const handleEmail = async (req, res) => {
  const { name, email, message } = req.body;
  console.log("Requête reçue avec :", req.body);

  try {
    console.log("Envoi de l'e-mail en cours...");
    await sendEmail(email, `Contact form submission from ${name}`, message);
    console.log("E-mail envoyé avec succès !");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleEmail };
