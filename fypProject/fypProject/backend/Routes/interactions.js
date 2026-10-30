const express = require('express');
const router = express.Router();
const UserInteraction = require('../Models/UserInteraction');
const axios = require("axios");
// Save user interaction
router.post('/save-interaction', async (req, res) => {
  const { userId, category, article } = req.body;

  try {
    const newInteraction = new UserInteraction({ userId, category, article });
    await newInteraction.save();
    res.status(200).json({ message: "Interaction saved successfully" });
  } catch (err) {
    console.error("Error saving interaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user interactions grouped by category (max 3 articles per category)
router.get('/user/:userId/interactions-grouped', async (req, res) => {
  const { userId } = req.params;

  try {
    const interactions = await UserInteraction.find({ userId });

    // Grouping logic
    const grouped = {};
    for (const interaction of interactions) {
      const category = interaction.category;

      if (!grouped[category]) {
        grouped[category] = [];
      }

      // Avoid duplicate articles and limit to 3
      if (!grouped[category].some(i => i.article.url === interaction.article.url)) {
        if (grouped[category].length < 3) {
          grouped[category].push(interaction);
        }
      }
    }

    res.status(200).json({ groupedInteractions: grouped });
  } catch (err) {
    console.error("Error fetching grouped interactions:", err);
    res.status(500).json({ error: err.message });
  }
});


// Fetch user interests (categories) based on their interactions
router.get('/user-interests', async (req, res) => {
    const { userId } = req.query;
    
    try {
      // Find the distinct categories the user has interacted with
      const userInteractions = await UserInteraction.distinct('category', { userId });
      
      if (userInteractions.length === 0) {
        return res.status(200).json({ message: 'No interactions found', interests: [] });
      }
      
      res.status(200).json({ interests: userInteractions });
    } catch (err) {
      console.error("Error fetching user interests:", err);
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const interactions = await UserInteraction.find({ userId });
    res.status(200).json({ interactions });
  } catch (err) {
    console.error("Error fetching user interactions:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/user/:userId/interests', async (req, res) => {
  const { userId } = req.params;

  try {
    const userInteractions = await UserInteraction.distinct('category', { userId });

    if (userInteractions.length === 0) {
      return res.status(200).json({ message: 'No interactions found', interests: [] });
    }

    res.status(200).json({ interests: userInteractions });
  } catch (err) {
    console.error("Error fetching user interests:", err);
    res.status(500).json({ error: err.message });
  }
});

// In routes/interactions.js


router.get("/user/:userId/news", async (req, res) => {
  const { userId } = req.params;
  const NEWS_API_KEY = "5a4d4277875e457f961063d72b04dd28";
  const { getFallbackNews } = require('../fallbackNews');

  try {
    const categories = await UserInteraction.distinct("category", { userId });
    const targetCategories = categories.length > 0 ? categories : ['technology', 'business'];
    const newsByCategory = {};

    for (const category of targetCategories) {
      try {
        const response = await axios.get(
          `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=3&country=us&apiKey=${NEWS_API_KEY}`
        );
        newsByCategory[category] = response.data.articles?.length ? response.data.articles : getFallbackNews(category);
      } catch (catErr) {
        newsByCategory[category] = getFallbackNews(category);
      }
    }

    res.status(200).json(newsByCategory);
  } catch (err) {
    console.error("Error fetching user news:", err);
    res.status(500).json({ message: "Failed to fetch news", error: err.message });
  }
});


const ArticleEngagement = require('../Models/ArticleEngagement');

// Get engagement for an article (likes and comments)
router.get('/engagement', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const engagement = await ArticleEngagement.findOne({ articleUrl: url });
    if (!engagement) {
      return res.status(200).json({ likesCount: 0, likedBy: [], comments: [] });
    }
    res.status(200).json({
      likesCount: engagement.likesCount || 0,
      likedBy: engagement.likedBy || [],
      comments: engagement.comments || []
    });
  } catch (err) {
    console.error("Engagement fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle Like
router.post('/like', async (req, res) => {
  const { articleUrl, articleTitle, userId } = req.body;
  if (!articleUrl || !userId) {
    return res.status(400).json({ error: "Article URL and userId are required" });
  }

  try {
    let engagement = await ArticleEngagement.findOne({ articleUrl });
    if (!engagement) {
      engagement = new ArticleEngagement({
        articleUrl,
        articleTitle: articleTitle || "",
        likesCount: 1,
        likedBy: [userId],
        comments: []
      });
      await engagement.save();
      return res.status(200).json({ liked: true, likesCount: 1 });
    }

    const alreadyLiked = engagement.likedBy.includes(userId);
    if (alreadyLiked) {
      engagement.likedBy = engagement.likedBy.filter(id => id !== userId);
      engagement.likesCount = Math.max(0, engagement.likesCount - 1);
    } else {
      engagement.likedBy.push(userId);
      engagement.likesCount += 1;
    }

    await engagement.save();
    res.status(200).json({ liked: !alreadyLiked, likesCount: engagement.likesCount });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Post Comment
router.post('/comment', async (req, res) => {
  const { articleUrl, articleTitle, userId, username, userAvatar, text } = req.body;
  if (!articleUrl || !text || !username) {
    return res.status(400).json({ error: "Article URL, username and text are required" });
  }

  try {
    let engagement = await ArticleEngagement.findOne({ articleUrl });
    const newComment = {
      userId: userId || null,
      username: username.trim(),
      userAvatar: userAvatar || "",
      text: text.trim(),
      createdAt: new Date()
    };

    if (!engagement) {
      engagement = new ArticleEngagement({
        articleUrl,
        articleTitle: articleTitle || "",
        likesCount: 0,
        likedBy: [],
        comments: [newComment]
      });
    } else {
      engagement.comments.unshift(newComment);
    }

    await engagement.save();
    res.status(201).json({ success: true, comment: newComment, comments: engagement.comments });
  } catch (err) {
    console.error("Post comment error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
