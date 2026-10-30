const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./Routes/auth');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('5a4d4277875e457f961063d72b04dd28');
const interactionRoutes = require('./Routes/interactions');
const path = require("path");

require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
// app.use('/uploads', express.static('uploads'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = "mongodb+srv://us543012_db_user:us12345@cluster0.yiv6i8m.mongodb.net/fypproject?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI);

const db = mongoose.connection;

// Event Listeners for the Connection
db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => {
  console.log('Connected to MongoDB');
  // Routes
  
  app.use('/api/interactions', interactionRoutes);
  app.use('/api/auth', authRoutes);
  app.use("/uploads", express.static("uploads"));

  const { getFallbackNews, enrichWithFactCheck } = require('./fallbackNews');

  app.get('/api/news', async (req, res) => {
    const category = req.query.category || 'general';
    const query = req.query.q || '';
    
    try {
      const options = {
        category: category,
        language: 'en',
        country: 'us',
        pageSize: 30
      };
      if (query) {
        options.q = query;
      }
      
      console.log(`Fetching news for category: ${category}, query: "${query}"`);
      const response = await newsapi.v2.topHeadlines(options);
      
      if (response && response.articles && response.articles.length > 0) {
        return res.json({
          ...response,
          articles: response.articles.map(enrichWithFactCheck)
        });
      } else {
        // Fallback to rich curated news if empty
        const fallback = getFallbackNews(category, query);
        return res.json({ status: "ok", totalResults: fallback.length, articles: fallback.map(enrichWithFactCheck) });
      }
    } catch (error) {
      console.warn("NewsAPI error, serving fallback curated news:", error.message);
      const fallback = getFallbackNews(category, query);
      return res.json({ status: "ok", totalResults: fallback.length, articles: fallback.map(enrichWithFactCheck), isFallback: true });
    }
  });

  app.get('/api/news/personalized', async (req, res) => {
    try {
      const categoriesParam = req.query.categories;
      let categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim().toLowerCase()) : [];
      
      // If userId provided and no explicit categories, look up user interactions
      if (categories.length === 0 && req.query.userId) {
        const UserInteraction = require('./Models/UserInteraction');
        const userCats = await UserInteraction.distinct('category', { userId: req.query.userId });
        if (userCats && userCats.length > 0) {
          categories = userCats;
        }
      }

      if (categories.length === 0) {
        categories = ['technology', 'business', 'general'];
      }

      let allArticles = [];
      for (const cat of categories) {
        try {
          const resp = await newsapi.v2.topHeadlines({
            category: cat,
            language: 'en',
            country: 'us',
            pageSize: 8
          });
          if (resp && resp.articles && resp.articles.length > 0) {
            resp.articles.forEach(a => a.category = cat);
            allArticles.push(...resp.articles);
          } else {
            const fallback = getFallbackNews(cat);
            fallback.forEach(a => a.category = cat);
            allArticles.push(...fallback);
          }
        } catch (e) {
          const fallback = getFallbackNews(cat);
          fallback.forEach(a => a.category = cat);
          allArticles.push(...fallback);
        }
      }

      // Deduplicate by URL
      const unique = [];
      const seen = new Set();
      for (const art of allArticles) {
        if (art.url && !seen.has(art.url)) {
          seen.add(art.url);
          unique.push(art);
        }
      }

      // Sort by newest publishedAt
      unique.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

      res.json({
        status: 'ok',
        categories,
        totalResults: unique.length,
        articles: unique
      });
    } catch (err) {
      console.error("Personalized fetch error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  // Start the server after successful connection
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});