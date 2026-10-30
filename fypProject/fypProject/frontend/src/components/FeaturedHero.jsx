import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useEngagement } from "../context/EngagementContext";
import {
  FiExternalLink,
  FiVolume2,
  FiVolumeX,
  FiBookmark,
  FiClock,
  FiUser,
  FiShare2,
  FiHeart,
  FiMessageSquare
} from "react-icons/fi";
import "./FeaturedHero.css";

const FeaturedHero = ({ article, onSelectArticle, onShareArticle }) => {
  const { isBookmarked, toggleBookmark } = useTheme();
  const { getLikes, getComments, toggleLike } = useEngagement();
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!article) return null;

  const bookmarked = isBookmarked(article.url);
  const likesData = getLikes(article.url);
  const commentsList = getComments(article.url);

  const fallbackImage =
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";
  const bgImage = article.urlToImage || fallbackImage;

  // Calculate reading time
  const wordCount = ((article.title || "") + " " + (article.description || "")).split(" ").length;
  const readTime = Math.max(1, Math.ceil(wordCount / 40));

  const handleSpeech = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const text = `${article.title}. ${article.description || ""}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    toggleBookmark(article, "featured");
  };

  const timeAgo = () => {
    if (!article.publishedAt) return "Recently";
    try {
      const diffMs = Date.now() - new Date(article.publishedAt).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return "Just now";
      if (diffHrs === 1) return "1 hour ago";
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} days ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <section className="hero-container">
      <div
        className="hero-card"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-tags">
            <span className="hero-spotlight-badge">
              <span className="pulse-dot"></span>
              Spotlight Story
            </span>
            <span className="hero-category-badge">
              {article.source?.name || "Global News"}
            </span>
          </div>

          <h1 className="hero-title">{article.title}</h1>

          {article.description && (
            <p className="hero-description">{article.description}</p>
          )}

          <div className="hero-meta">
            <span className="hero-meta-item">
              <FiUser /> {article.author || article.source?.name || "Editorial Desk"}
            </span>
            <span className="hero-meta-item">
              <FiClock /> {timeAgo()} • {readTime} min read
            </span>
          </div>

          <div className="hero-actions">
            <button
              className="hero-btn-primary"
              onClick={() => {
                if (onSelectArticle) {
                  onSelectArticle(article);
                } else {
                  window.open(article.url, "_blank");
                }
              }}
            >
              <span>Read Full Story</span>
              <FiExternalLink />
            </button>

            <button
              className="hero-btn-secondary"
              onClick={handleSpeech}
              title={isSpeaking ? "Pause Audio" : "Listen to this story"}
            >
              {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
              <span>{isSpeaking ? "Stop Audio" : "Listen Story"}</span>
            </button>

            <button
              className="hero-btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(article);
              }}
              title={likesData.userLiked ? "Unlike story" : "Like story"}
              style={{
                color: likesData.userLiked ? "#F43F5E" : "#fff",
                borderColor: likesData.userLiked ? "#F43F5E" : "rgba(255,255,255,0.25)"
              }}
            >
              <FiHeart style={{ fill: likesData.userLiked ? "#F43F5E" : "none" }} />
              <span>{likesData.count}</span>
            </button>

            <button
              className="hero-btn-secondary"
              onClick={() => {
                if (onSelectArticle) onSelectArticle(article, true);
              }}
              title="Join discussion & view comments"
            >
              <FiMessageSquare />
              <span>{commentsList.length}</span>
            </button>

            <button
              className={`hero-btn-icon ${bookmarked ? "active" : ""}`}
              onClick={handleBookmarkClick}
              title={bookmarked ? "Remove from Reading List" : "Save to Reading List"}
            >
              <FiBookmark />
            </button>

            {onShareArticle && (
              <button
                className="hero-btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareArticle(article);
                }}
                title="Share this story"
              >
                <FiShare2 />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHero;
