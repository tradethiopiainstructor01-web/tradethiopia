const mongoose = require('mongoose');

const MaterialCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialCategory', // Reference to the same model
        default: null,
    },
});

const MaterialCategory = mongoose.model('MaterialCategory', MaterialCategorySchema);
module.exports = MaterialCategory;