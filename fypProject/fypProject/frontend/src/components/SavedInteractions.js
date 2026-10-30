import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ArticleModal from "./ArticleModal";
import {
  FiBookmark,
  FiTrash2,
  FiExternalLink,
  FiSearch,
  FiVolume2,
  FiVolumeX,
  FiClock,
  FiEye,
  FiArrowLeft
} from "react-icons/fi";
import "./NewsFeed.css";

const SavedInteractions = () => {
  const { savedArticles, removeBookmark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const [speakingUrl, setSpeakingUrl] = useState(null);
  const [serverArticles, setServerArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetch(`http://localhost:5000/api/interactions/user/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.interactions) {
            const mapped = data.interactions.map((i) => ({
              ...i.article,
              category: i.category,
              savedAt: i.timestamp
            }));
            setServerArticles(mapped);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.log("Server sync note:", err);
          setLoading(false);
        });
    }
  }, [userId]);

  // Combine localStorage savedArticles with server interactions, deduplicated by url
  const combinedArticles = useMemo(() => {
    const map = new Map();
    savedArticles.forEach((a) => {
      if (a && a.url) map.set(a.url, a);
    });
    serverArticles.forEach((a) => {
      if (a && a.url && !map.has(a.url)) map.set(a.url, a);
    });
    return Array.from(map.values());
  }, [savedArticles, serverArticles]);

  const categories = useMemo(() => {
    const set = new Set();
    combinedArticles.forEach((a) => {
      if (a.category) set.add(a.category.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [combinedArticles]);

  const filteredArticles = useMemo(() => {
    return combinedArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (article.category && article.category.toLowerCase() === selectedCategory);

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        article.title?.toLowerCase().includes(q) ||
        article.description?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [combinedArticles, selectedCategory, searchTerm]);

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

  return (
    <div className="feed-container">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: 12
          }}
        >
          <FiArrowLeft /> Back to Headlines
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}>
              <FiBookmark style={{ color: "var(--accent-primary)" }} />
              Reading List & Saved Stories
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 4 }}>
              Stories you bookmarked to read later, available anytime.
            </p>
          </div>
          <span className="feed-count-badge" style={{ fontSize: "1rem", padding: "6px 16px" }}>
            {combinedArticles.length} Saved Stories
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="feed-header-bar" style={{ marginTop: 10 }}>
        {/* Category Pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ textTransform: "capitalize" }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="feed-search-box">
          <FiSearch className="feed-search-icon" />
          <input
            type="text"
            className="feed-search-input"
            placeholder="Search saved articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="empty-feed-box">
          <FiBookmark className="empty-icon" />
          <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Your reading list is empty</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            {searchTerm || selectedCategory !== "all"
              ? "No saved articles match your current search or category filter."
              : "Click the bookmark icon on any article to save it for reading later."}
          </p>
          <Link to="/" className="card-read-btn" style={{ textDecoration: "none", display: "inline-flex" }}>
            Explore Headlines
          </Link>
        </div>
      ) : (
        <div className="news-cards-grid">
          {filteredArticles.map((article, index) => {
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
                    {article.source?.name || article.category || "Saved Article"}
                  </span>
                  <button
                    className="card-bookmark-btn active"
                    onClick={() => removeBookmark(article.url)}
                    title="Remove from Reading List"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="card-content">
                  <div className="card-meta-bar">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <FiClock /> Saved
                    </span>
                    {article.category && (
                      <>
                        <span>•</span>
                        <span style={{ textTransform: "capitalize" }}>{article.category}</span>
                      </>
                    )}
                  </div>

                  <h3
                    className="card-title"
                    onClick={() => setActiveModalArticle(article)}
                  >
                    {article.title}
                  </h3>

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
                        <span>Open</span>
                        <FiExternalLink />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
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

export default SavedInteractions;
