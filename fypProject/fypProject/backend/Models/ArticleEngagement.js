const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  username: { type: String, required: true },
  userAvatar: { type: String, default: "" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const articleEngagementSchema = new mongoose.Schema({
  articleUrl: { type: String, required: true, unique: true },
  articleTitle: { type: String, default: "" },
  likesCount: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  comments: [commentSchema]
});

module.exports = mongoose.model('ArticleEngagement', articleEngagementSchema);
