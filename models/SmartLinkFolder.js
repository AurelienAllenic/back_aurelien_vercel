const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Folder', FolderSchema);
