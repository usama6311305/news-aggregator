const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  article: {
    title: String,
    description: String,
    url: String,
    urlToImage: String,
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
