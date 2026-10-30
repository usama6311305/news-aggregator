import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useEngagement } from "../context/EngagementContext";
import ArticleModal from "./ArticleModal";
import {
  FiSearch,
  FiBookmark,
  FiExternalLink,
  FiVolume2,
  FiVolumeX,
  FiClock,
  FiEye,
  FiInbox,
  FiGlobe,
  FiZap,
  FiFilter,
  FiCheck,
  FiHeart,
  FiMessageSquare
} from "react-icons/fi";
import "./NewsFeed.css";

const CATEGORY_FALLBACK_IMAGES = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  business: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
  health: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
  science: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  general: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"
};

const AVAILABLE_TOPICS = [
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
  { id: "entertainment", label: "Entertainment" },
  { id: "general", label: "General" }
];

const NewsFeed = ({ initialCategory, externalSearch = "", forceMode = null }) => {
  const { category: paramCategory } = useParams();
  const location = useLocation();
  const selectedCategory = initialCategory || paramCategory || "general";
  const { isBookmarked, toggleBookmark } = useTheme();
  const { getLikes, getComments, toggleLike } = useEngagement();

  // Mode: "base" (standard news) or "personalized" (curated based on interests & history)
  const isPersonalRoute = location.pathname === "/personal" || selectedCategory === "personal" || forceMode === "personalized";
  const [feedMode, setFeedMode] = useState(isPersonalRoute ? "personalized" : "base");

  // User's active interest categories for personalized mode
  const [selectedInterests, setSelectedInterests] = useState(() => {
    try {
      const stored = localStorage.getItem("userInterests");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ["technology", "business", "science"];
  });

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [speakingUrl, setSpeakingUrl] = useState(null);
  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const [scrollToComments, setScrollToComments] = useState(false);
  const [activePersonalizedSubCategory, setActivePersonalizedSubCategory] = useState("all");

  const userId = localStorage.getItem("userId");

  // Keep route changes in sync
  useEffect(() => {
    if (location.pathname === "/personal" || selectedCategory === "personal") {
      setFeedMode("personalized");
    }
  }, [location.pathname, selectedCategory]);

  useEffect(() => {
    if (externalSearch) {
      setSearchTerm(externalSearch);
    }
  }, [externalSearch]);

  // Main fetch effect depending on feedMode
  useEffect(() => {
    setLoading(true);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingUrl(null);
    }

    let apiUrl = "";
    if (feedMode === "personalized") {
      const cats = selectedInterests.join(",");
      apiUrl = `http://localhost:5000/api/news/personalized?categories=${encodeURIComponent(cats)}${userId ? `&userId=${userId}` : ""}`;
    } else {
      apiUrl = `http://localhost:5000/api/news?category=${selectedCategory}`;
    }

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok && feedMode === "personalized") {
          throw new Error("Personalized endpoint fallback");
        }
        return res.json();
      })
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => {
        if (feedMode === "personalized") {
          // Parallel fetch for each selected interest across base news
          const promises = selectedInterests.map((cat) =>
            fetch(`http://localhost:5000/api/news?category=${cat}`)
              .then((r) => r.json())
              .then((d) => (d.articles || []).map((a) => ({ ...a, category: cat })))
              .catch(() => [])
          );
          Promise.all(promises).then((results) => {
            const combined = results.flat();
            const seen = new Set();
            const unique = [];
            combined.forEach((a) => {
              if (a.url && !seen.has(a.url)) {
                seen.add(a.url);
                unique.push(a);
              }
            });
            unique.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
            setArticles(unique);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
  }, [feedMode, selectedCategory, selectedInterests, userId]);

  const toggleInterestTopic = (topicId) => {
    setSelectedInterests((prev) => {
      let updated;
      if (prev.includes(topicId)) {
        if (prev.length === 1) return prev; // Keep at least one
        updated = prev.filter((t) => t !== topicId);
      } else {
        updated = [...prev, topicId];
      }
      localStorage.setItem("userInterests", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSpeech = (article, e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

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

  const handleReadMore = (article) => {
    const activeUserId = localStorage.getItem("userId");

    if (activeUserId) {
      fetch("http://localhost:5000/api/interactions/save-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          category: article.category || selectedCategory,
          article,
        }),
      }).catch((err) => console.log("Interaction note:", err));
    }

    window.open(article.url, "_blank");
  };

  const filteredAndSortedArticles = useMemo(() => {
    let result = articles.filter((article) => {
      // Sub-category filter in personalized mode
      if (
        feedMode === "personalized" &&
        activePersonalizedSubCategory !== "all" &&
        article.category &&
        article.category.toLowerCase() !== activePersonalizedSubCategory.toLowerCase()
      ) {
        return false;
      }

      const q = searchTerm.toLowerCase();
      const inTitle = article.title?.toLowerCase().includes(q) || false;
      const inDesc = article.description?.toLowerCase().includes(q) || false;
      const inSource = article.source?.name?.toLowerCase().includes(q) || false;
      return inTitle || inDesc || inSource;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [articles, searchTerm, sortBy, feedMode, activePersonalizedSubCategory]);

  const getFallbackImg = (cat = "general") => {
    return CATEGORY_FALLBACK_IMAGES[cat.toLowerCase()] || CATEGORY_FALLBACK_IMAGES.general;
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return "Just now";
      if (diffHrs === 1) return "1h ago";
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="feed-container">
      {/* Feed Source Mode Switcher: Base News vs. Personalized News */}
      <div className="feed-mode-tabs-wrapper">
        <div className="feed-mode-tabs">
          <button
            className={`feed-mode-tab ${feedMode === "base" ? "active" : ""}`}
            onClick={() => setFeedMode("base")}
          >
            <FiGlobe /> Base Headlines
          </button>
          <button
            className={`feed-mode-tab ${feedMode === "personalized" ? "active" : ""}`}
            onClick={() => setFeedMode("personalized")}
          >
            <FiZap /> Personalized For You ✨
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {feedMode === "personalized" ? (
            <span>
              🎯 Filtered by {selectedInterests.length} selected {selectedInterests.length === 1 ? "topic" : "topics"}
            </span>
          ) : (
            <span>🌐 Showing standard category feed</span>
          )}
        </div>
      </div>

      {/* Personalized Topic Filter Panel (Shown when in Personalized mode) */}
      {feedMode === "personalized" && (
        <div className="personalized-filter-panel">
          <div className="personalized-filter-header">
            <div className="personalized-filter-title">
              <FiFilter style={{ color: "var(--accent-primary)" }} />
              <span>Personalize Your Feed Topics</span>
            </div>
            <span className="personalized-filter-subtitle">
              Click topics to add or remove them from your personalized stream
            </span>
          </div>

          <div className="interest-chips-row">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = selectedInterests.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  className={`interest-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleInterestTopic(topic.id)}
                >
                  {isSelected && <FiCheck style={{ fontSize: "0.75rem" }} />}
                  <span>{topic.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subcategory quick filter when multiple topics are selected */}
          {selectedInterests.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-light)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Quick Filter:
              </span>
              <button
                className={`category-chip ${activePersonalizedSubCategory === "all" ? "active" : ""}`}
                style={{ padding: "3px 12px", fontSize: "0.75rem" }}
                onClick={() => setActivePersonalizedSubCategory("all")}
              >
                All Selected ({articles.length})
              </button>
              {selectedInterests.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${activePersonalizedSubCategory === cat ? "active" : ""}`}
                  style={{ padding: "3px 12px", fontSize: "0.75rem", textTransform: "capitalize" }}
                  onClick={() => setActivePersonalizedSubCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feed Header Bar (Title, Count, Search, Sort) */}
      <div className="feed-header-bar">
        <div className="feed-title-section">
          <h2 className="feed-main-title">
            {feedMode === "personalized" ? "Your Curated Stream" : `${selectedCategory} Headlines`}
          </h2>
          {!loading && (
            <span className="feed-count-badge">
              {filteredAndSortedArticles.length} stories
            </span>
          )}
        </div>

        <div className="feed-controls">
          <div className="feed-search-box">
            <FiSearch className="feed-search-icon" />
            <input
              type="text"
              className="feed-search-input"
              placeholder={`Search ${feedMode === "personalized" ? "personalized" : selectedCategory} stories...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="feed-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="news-cards-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-media"></div>
              <div className="skeleton-body">
                <div className="skeleton-line" style={{ width: "35%" }}></div>
                <div className="skeleton-line" style={{ width: "85%", height: 18 }}></div>
                <div className="skeleton-line" style={{ width: "70%", height: 18 }}></div>
                <div className="skeleton-line" style={{ width: "95%", marginTop: 16 }}></div>
                <div className="skeleton-line" style={{ width: "60%" }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedArticles.length === 0 ? (
        <div className="empty-feed-box">
          <FiInbox className="empty-icon" />
          <h3 style={{ marginBottom: 8, fontSize: "1.3rem" }}>No articles found</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            {searchTerm
              ? `No stories matched your search "${searchTerm}".`
              : "No headlines found matching the selected topics."}
          </p>
          {searchTerm && (
            <button
              className="card-preview-btn"
              onClick={() => setSearchTerm("")}
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        /* News Cards Grid */
        <div className="news-cards-grid">
          {filteredAndSortedArticles.map((article, index) => {
            const bookmarked = isBookmarked(article.url);
            const likesData = getLikes(article.url);
            const commentsList = getComments(article.url);
            const isSpeaking = speakingUrl === article.url;
            const wordCount = ((article.title || "") + " " + (article.description || "")).split(" ").length;
            const readTime = Math.max(1, Math.ceil(wordCount / 40));
            const articleCategory = article.category || selectedCategory || "general";

            return (
              <article key={article.url || index} className="news-card">
                <div className="card-media-wrapper">
                  <img
                    src={article.urlToImage || getFallbackImg(articleCategory)}
                    alt={article.title}
                    className="card-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = getFallbackImg(articleCategory);
                    }}
                  />
                  <span className="card-source-pill">
                    {article.category ? (
                      <span style={{ textTransform: "capitalize" }}>
                        {article.category} • {article.source?.name || "News"}
                      </span>
                    ) : (
                      article.source?.name || "Global News"
                    )}
                  </span>
                  <button
                    className={`card-bookmark-btn ${bookmarked ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article, articleCategory);
                    }}
                    title={bookmarked ? "Remove Bookmark" : "Save for Later"}
                  >
                    <FiBookmark />
                  </button>
                </div>

                <div className="card-content">
                  <div className="card-meta-bar">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <FiClock /> {getTimeAgo(article.publishedAt)}
                    </span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                  </div>

                  <h3
                    className="card-title"
                    onClick={() => {
                      setScrollToComments(false);
                      setActiveModalArticle(article);
                    }}
                  >
                    {article.title}
                  </h3>

                  <p className="card-description">
                    {article.description || "Read full coverage, analysis, and multimedia reports on the original publisher."}
                  </p>

                  {/* Likes & Comments Engagement Row */}
                  <div className="card-engagement-bar">
                    <div className="card-engagement-actions">
                      <button
                        className={`card-engage-btn ${likesData.userLiked ? "liked" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(article);
                        }}
                        title={likesData.userLiked ? "Unlike story" : "Like story"}
                      >
                        <FiHeart />
                        <span>{likesData.count}</span>
                      </button>

                      <button
                        className="card-engage-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScrollToComments(true);
                          setActiveModalArticle(article);
                        }}
                        title="View and write comments"
                      >
                        <FiMessageSquare />
                        <span>{commentsList.length}</span>
                      </button>
                    </div>

                    <button
                      className={`card-audio-btn ${isSpeaking ? "speaking" : ""}`}
                      onClick={(e) => handleSpeech(article, e)}
                      title={isSpeaking ? "Stop speech" : "Listen to headline"}
                    >
                      {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
                      <span>{isSpeaking ? "Stop" : "Listen"}</span>
                    </button>
                  </div>

                  <div className="card-footer" style={{ borderTop: "none", paddingTop: 10 }}>
                    <div></div>
                    <div className="card-actions-right">
                      <button
                        className="card-preview-btn"
                        onClick={() => {
                          setScrollToComments(false);
                          setActiveModalArticle(article);
                        }}
                      >
                        <FiEye style={{ marginRight: 4 }} /> Preview
                      </button>

                      <button
                        className="card-read-btn"
                        onClick={() => handleReadMore(article)}
                      >
                        <span>Read</span>
                        <FiExternalLink />
                      </button>
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
          initialScrollToComments={scrollToComments}
          onClose={() => {
            setActiveModalArticle(null);
            setScrollToComments(false);
          }}
        />
      )}
    </div>
  );
};

export default NewsFeed;
