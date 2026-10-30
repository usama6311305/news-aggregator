import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ArticleModal from "./ArticleModal";
import {
  FiCompass,
  FiBookmark,
  FiExternalLink,
  FiVolume2,
  FiVolumeX,
  FiEye,
  FiZap,
  FiLogIn
} from "react-icons/fi";
import "./NewsFeed.css";

const PersonalizedNews = () => {
  const [user, setUser] = useState(null);
  const [news, setNews] = useState({});
  const [loading, setLoading] = useState(true);
  const [speakingUrl, setSpeakingUrl] = useState(null);
  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const { isBookmarked, toggleBookmark } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/interactions/user/${user.id}/news`)
      .then((res) => res.json())
      .then((data) => {
        setNews(data || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load personalized news:", err);
        setLoading(false);
      });
  }, [user]);

  const handleSpeech = (article, e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    if (speakingUrl === article.url) {
      window.speechSynthesis.cancel();
      setSpeakingUrl(null);
    } else {
      window.speechSynthesis.cancel();
      const text = `${article.title}. ${article.description || ""}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingUrl(null);
      utterance.onerror = () => setSpeakingUrl(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingUrl(article.url);
    }
  };

  // If user is not logged in, display an invitation banner rather than kicking them out
  if (!user) {
    return (
      <div className="feed-container" style={{ paddingTop: 20 }}>
        <div
          className="glass-panel"
          style={{
            padding: "36px 32px",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            maxWidth: 700,
            margin: "0 auto 40px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(34, 211, 238, 0.05) 100%)",
            border: "1px solid var(--border-light)"
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              margin: "0 auto 16px",
              boxShadow: "0 4px 16px var(--accent-glow)"
            }}
          >
            <FiZap />
          </div>

          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, marginBottom: 10 }}>
            Personalized Feed Tailored To You
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 24px" }}>
            Sign in to unlock an adaptive smart feed that learns the news topics, sources, and stories you care about most.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link to="/login" className="btn-nav-gradient" style={{ padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <FiLogIn /> Sign In to Personalize
            </Link>
            <Link to="/signup" className="btn-nav-outline" style={{ padding: "10px 24px" }}>
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container" style={{ paddingTop: 10 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className="pulse-badge">
            <span className="pulse-dot"></span>
            Smart Algorithm
          </span>
        </div>
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800 }}>
          Your For You Feed, {user.username}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: 4 }}>
          Handpicked stories based on your reading history and category preferences.
        </p>
      </div>

      {loading ? (
        <div className="news-cards-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-media"></div>
              <div className="skeleton-body">
                <div className="skeleton-line" style={{ width: "40%" }}></div>
                <div className="skeleton-line" style={{ width: "90%", height: 18 }}></div>
                <div className="skeleton-line" style={{ width: "75%", height: 18 }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(news).length === 0 ? (
        <div className="empty-feed-box">
          <FiCompass className="empty-icon" />
          <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Building your reading profile...</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            Start reading and bookmarking articles across different categories to see tailored recommendations here.
          </p>
          <Link to="/" className="card-read-btn" style={{ textDecoration: "none", display: "inline-flex" }}>
            Browse Top Headlines
          </Link>
        </div>
      ) : (
        Object.entries(news).map(([category, articles]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--border-light)",
                marginBottom: 20
              }}
            >
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, textTransform: "capitalize" }}>
                {category} Highlights
              </h3>
              <Link
                to={`/news/${category}`}
                style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 600 }}
              >
                View all in {category} →
              </Link>
            </div>

            <div className="news-cards-grid">
              {articles.map((article, idx) => {
                const bookmarked = isBookmarked(article.url);
                const isSpeaking = speakingUrl === article.url;

                return (
                  <article key={article.url || idx} className="news-card">
                    <div className="card-media-wrapper">
                      <img
                        src={
                          article.urlToImage ||
                          "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={article.title}
                        className="card-image"
                      />
                      <span className="card-source-pill">
                        {article.source?.name || category}
                      </span>
                      <button
                        className={`card-bookmark-btn ${bookmarked ? "active" : ""}`}
                        onClick={() => toggleBookmark(article, category)}
                      >
                        <FiBookmark />
                      </button>
                    </div>

                    <div className="card-content">
                      <h4
                        className="card-title"
                        onClick={() => setActiveModalArticle(article)}
                      >
                        {article.title}
                      </h4>

                      <p className="card-description">
                        {article.description || "Read full synopsis and insights from the original publication."}
                      </p>

                      <div className="card-footer">
                        <button
                          className={`card-audio-btn ${isSpeaking ? "speaking" : ""}`}
                          onClick={(e) => handleSpeech(article, e)}
                        >
                          {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
                          <span>{isSpeaking ? "Stop" : "Listen"}</span>
                        </button>

                        <div className="card-actions-right">
                          <button
                            className="card-preview-btn"
                            onClick={() => setActiveModalArticle(article)}
                          >
                            <FiEye style={{ marginRight: 4 }} /> Preview
                          </button>

                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-read-btn"
                          >
                            <span>Read</span>
                            <FiExternalLink />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Reader Modal */}
      {activeModalArticle && (
        <ArticleModal
          article={activeModalArticle}
          onClose={() => setActiveModalArticle(null)}
        />
      )}
    </div>
  );
};

export default PersonalizedNews;