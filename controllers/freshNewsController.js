import FreshNews from "../models/FreshNews.js";

// 🧩 Créer ou mettre à jour l’unique Fresh News
export const upsertFreshNews = async (req, res) => {
  try {
    const { title, link, isInternal, isActive } = req.body;
    const news = await FreshNews.ensureSingleInstance({
      title,
      link,
      isInternal,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });
    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la Fresh News." });
  }
};

// 📥 Récupérer la Fresh News
export const getFreshNews = async (req, res) => {
  try {
    const news = await FreshNews.findOne();
    if (!news) {
      return res.status(404).json({ message: "Aucune Fresh News trouvée." });
    }
    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la Fresh News." });
  }
};
