const sendEmail = require("../config/mailer");

const handleEmail = async (req, res) => {
  console.log("Requête reçue avec :", req.body);

  try {
    console.log("Envoi de l'e-mail...");
    await sendEmail(email, `Contact de ${name}`, message);
    console.log("E-mail envoyé !");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur e-mail :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleEmail };
