const Folder = require('../models/Folder');
const mongoose = require("mongoose");

// ✅ Ajouter un dossier
exports.addFolder = async (req, res) => {
    console.log("Données reçues :", req.body);
    const { name, parentFolder } = req.body;

    if (!name) {
        console.log("Nom du dossier manquant");
        return res.status(400).json({ message: 'Le nom du dossier est requis.' });
    }

    try {
        const newFolder = new Folder({ 
            name, 
            parentFolder: parentFolder ? new mongoose.Types.ObjectId(parentFolder) : null // Gère les sous-dossiers
        });

        await newFolder.save();
        res.status(201).json({ message: 'Dossier créé avec succès', data: newFolder });
    } catch (error) {
        console.error("Erreur backend :", error);
        res.status(400).json({ message: 'Erreur lors de la création du dossier', error: error.message });
    }
};

// ✅ Récupérer tous les dossiers
exports.findAllFolders = async (req, res) => {
    try {
        const folders = await Folder.find().populate('parentFolder'); // Récupère aussi le dossier parent
        res.status(200).json({ message: 'Liste des dossiers', data: folders });
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la récupération des dossiers', error: error.message });
    }
};

// ✅ Récupérer un dossier par ID
exports.findOneFolder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }

    try {
        const folder = await Folder.findById(id).populate('parentFolder');
        if (!folder) {
            return res.status(404).json({ message: 'Dossier non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier trouvé', data: folder });
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la récupération du dossier', error: error.message });
    }
};

// ✅ Mettre à jour un dossier
exports.updateFolder = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Données reçues pour la mise à jour:', updateData);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
    }

    try {
        // Si un parentFolder est fourni, s'assurer qu'il est bien sous forme d'ObjectId
        if (updateData.parentFolder) {
            updateData.parentFolder = new mongoose.Types.ObjectId(updateData.parentFolder);
        }

        const updatedFolder = await Folder.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('parentFolder');

        if (!updatedFolder) {
            return res.status(404).json({ message: 'Dossier non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier mis à jour avec succès', data: updatedFolder });
    } catch (error) {
        console.error('Erreur lors de la mise à jour :', error);
        res.status(400).json({ message: 'Erreur lors de la mise à jour du dossier', error: error.message });
    }
};

// ✅ Supprimer un dossier
exports.deleteFolder = async (req, res) => {
    const { id } = req.params;
    console.log("ID reçu pour suppression : ", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }

    try {
        // Vérifier si le dossier a des sous-dossiers avant suppression
        const subfolders = await Folder.find({ parentFolder: id });

        if (subfolders.length > 0) {
            return res.status(400).json({ message: 'Impossible de supprimer ce dossier car il contient des sous-dossiers.' });
        }

        const result = await Folder.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Dossier non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier supprimé avec succès.' });
    } catch (error) {
        console.error("Erreur lors de la suppression du dossier : ", error);
        res.status(400).json({ message: 'Erreur lors de la suppression du dossier', error: error.message });
    }
};
