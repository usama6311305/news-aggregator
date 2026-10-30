import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArticleModal from "./ArticleModal";
import { useTheme } from "../context/ThemeContext";
import {
  FiCompass,
  FiExternalLink,
  FiBookmark,
  FiVolume2,
  FiVolumeX,
  FiEye,
  FiArrowLeft
} from "react-icons/fi";
import "./NewsFeed.css";

const UserRecommendations = () => {
  const [groupedInteractions, setGroupedInteractions] = useState({});
  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const [speakingUrl, setSpeakingUrl] = useState(null);
  const { isBookmarked, toggleBookmark } = useTheme();

  let user = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) user = JSON.parse(raw);
  } catch (e) {
    user = null;
  }

  useEffect(() => {
    if (!user || !user.id) return;

    fetch(`http://localhost:5000/api/interactions/user/${user.id}/interactions-grouped`)
      .then((res) => res.json())
      .then((data) => {
        setGroupedInteractions(data.groupedInteractions || {});
      })
      .catch((err) => console.error("Error fetching interactions:", err));
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

  if (!user) {
    return (
      <div className="feed-container" style={{ paddingTop: 40, textAlign: "center" }}>
        <FiCompass style={{ fontSize: "3rem", color: "var(--accent-primary)", marginBottom: 12 }} />
        <h2>Sign in to view recommendations</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
          Your reading history powers personalized topic suggestions.
        </p>
        <Link to="/login" className="btn-nav-gradient" style={{ display: "inline-block" }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="feed-container" style={{ paddingTop: 20 }}>
      <Link to="/" className="auth-back-link" style={{ marginBottom: 20 }}>
        <FiArrowLeft /> Back to Headlines
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Recommended For You</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
          Articles grouped by topics you've recently engaged with.
        </p>
      </div>

      {Object.keys(groupedInteractions).length === 0 ? (
        <div className="empty-feed-box">
          <FiCompass className="empty-icon" />
          <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>No interactions recorded yet</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            Click and read articles to automatically build your smart recommendation feed.
          </p>
          <Link to="/" className="card-read-btn" style={{ textDecoration: "none", display: "inline-flex" }}>
            Browse News
          </Link>
        </div>
      ) : (
        Object.entries(groupedInteractions).map(([category, articles]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                textTransform: "capitalize",
                paddingBottom: 10,
                borderBottom: "1px solid var(--border-light)",
                marginBottom: 20
              }}
            >
              {category} Recommendations
            </h3>

            <div className="news-cards-grid">
              {articles.map((item, index) => {
                const article = item.article || {};
                const bookmarked = isBookmarked(article.url);
                const isSpeaking = speakingUrl === article.url;

                return (
                  <article key={article.url || index} className="news-card">
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
                        {category}
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

      {activeModalArticle && (
        <ArticleModal
          article={activeModalArticle}
          onClose={() => setActiveModalArticle(null)}
        />
      )}
    </div>
  );
};

export default UserRecommendations;
