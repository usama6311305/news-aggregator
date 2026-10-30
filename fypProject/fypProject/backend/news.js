const express = require('express');
const NewsAPI = require('newsapi');
const cors = require('cors');

const app = express();
const newsapi = new NewsAPI('c060f6db3a81401db0ba6678cebd99bb');

// Enable CORS (important for frontend-backend communication)
app.use(cors());

// Define a route for fetching top headlines
app.get('/api/news', async (req, res) => {
    try {
        const response = await newsapi.v2.topHeadlines({
            // q: 'bitcoin',
            category: 'business',
            language: 'en',
            country: 'us',
        });
        console.log('Response', response)
        res.json(response); // Send response to frontend
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

  
// To query /v2/everything
// You must include at least one q, source, or domain
// newsapi.v2.everything({
//   q: 'bitcoin',
//   sources: 'bbc-news,the-verge',
//   domains: 'bbc.co.uk, techcrunch.com',
//   from: '2017-12-01',
//   to: '2017-12-12',
//   language: 'en',
//   sortBy: 'relevancy',
//   page: 2
// }).then(response => {
//   console.log(response);
//   /*
//     {
//       status: "ok",
//       articles: [...]
//     }
//   */
// });
// // To query sources
// // All options are optional
// newsapi.v2.sources({
//   category: 'technology',
//   language: 'en',
//   country: 'us'
// }).then(response => {
//   console.log(response);
//   /*
//     {
//       status: "ok",
//       sources: [...]
//     }
//   */
// });