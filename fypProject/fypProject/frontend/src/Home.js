import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NewsTicker from "./components/NewsTicker";
import FeaturedHero from "./components/FeaturedHero";
import NewsFeed from "./components/NewsFeed";
import PersonalizedNews from "./components/PersonalizedNews";
import ArticleModal from "./components/ArticleModal";
import { FiTrendingUp, FiZap, FiArrowRight } from "react-icons/fi";
import "./Home.css";

const Home = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [initialScrollComments, setInitialScrollComments] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Safely parse user
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        setCurrentUser(null);
      }
    }

    // Fetch initial headlines for Hero & Ticker
    fetch("http://localhost:5000/api/news?category=general")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.articles && data.articles.length > 0) {
          setFeaturedArticles(data.articles);
        }
      })
      .catch((err) => console.log("Initial fetch error:", err));
  }, []);

  const heroArticle = featuredArticles.length > 0 ? featuredArticles[0] : null;

  return (
    <div className="home-page-container">
      {/* Breaking News Marquee Ticker */}
      <NewsTicker
        articles={featuredArticles}
        onSelectArticle={(article) => {
          setInitialScrollComments(false);
          setSelectedArticle(article);
        }}
      />

      {/* Hero Spotlight Story */}
      {heroArticle && (
        <div className="home-hero-wrapper">
          <FeaturedHero
            article={heroArticle}
            onSelectArticle={(article, toComments = false) => {
              setInitialScrollComments(toComments);
              setSelectedArticle(article);
            }}
            onShareArticle={(article) => {
              setInitialScrollComments(false);
              setSelectedArticle(article);
            }}
          />
        </div>
      )}

      {/* Guest Welcome Banner if not logged in */}
      {!currentUser && (
        <section className="guest-welcome-card">
          <div className="guest-welcome-inner">
            <div className="guest-welcome-text">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <FiZap style={{ color: "var(--accent-primary)" }} />
                <h3>Welcome to the Next-Gen News Aggregator</h3>
              </div>
              <p>
                Experience real-time AI news curation, text-to-speech audio narration, and instant reading lists.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/signup" className="btn-nav-gradient">
                Join Free <FiArrowRight style={{ marginLeft: 4 }} />
              </Link>
            </div>
          </div>
        </section>
      )}


      {/* Section Divider */}
      <div className="home-section-divider">
        <hr />
      </div>

      {/* Main Multi-Category News Feed */}
      <NewsFeed initialCategory="general" />

      {/* Modal Reader if clicked */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          initialScrollToComments={initialScrollComments}
          onClose={() => {
            setSelectedArticle(null);
            setInitialScrollComments(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="footer-brand">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800
              }}
            >
              <FiTrendingUp />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NewsPulse
            </span>
          </div>

          <div className="footer-nav-links">
            <Link to="/news/technology">Technology</Link>
            <Link to="/news/business">Business</Link>
            <Link to="/news/sports">Sports</Link>
            <Link to="/news/science">Science</Link>
            <Link to="/saved">Reading List</Link>
          </div>

          <p className="footer-copyright">
            © 2026 NewsPulse Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
