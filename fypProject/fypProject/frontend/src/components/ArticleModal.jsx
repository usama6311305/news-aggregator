import React, { useState, useEffect } from "react"; // <-- ADDED THIS LINE
import { useTheme } from "../context/ThemeContext";
import { useEngagement } from "../context/EngagementContext";
import { getArticleFactCheck } from "../utils/factCheckHelper";
import {
  FiX,
  FiVolume2,
  FiVolumeX,
  FiBookmark,
  FiExternalLink,
  FiShare2,
  FiCheck,
  FiCopy,
  FiHeart,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiShield,
  FiCheckCircle,
  FiAward
} from "react-icons/fi";
import { FaTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import "./ArticleModal.css";

const ArticleModal = ({ article, onClose, initialScrollToComments = false }) => {
  const { isBookmarked, toggleBookmark } = useTheme();
  const { getLikes, getComments, toggleLike, addComment, loadEngagement } = useEngagement();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check logged in user
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch { }

    if (article && article.url) {
      loadEngagement(article.url);
    }

    if (initialScrollToComments) {
      setTimeout(() => {
        const el = document.getElementById("modal-comments-anchor");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article, initialScrollToComments]);

  if (!article) return null;

  const bookmarked = isBookmarked(article.url);
  const likesData = getLikes(article.url);
  const commentsList = getComments(article.url);

  const fallbackImage =
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80";
  const displayImage = article.urlToImage || fallbackImage;

  const handleAudioToggle = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported on your device/browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${article.title}. Published by ${article.source?.name || "News source"
        }. ${article.description || article.content || ""}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Reading: ${article.title}`);
    const url = encodeURIComponent(article.url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(article.url);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${article.title} - ${article.url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(article, commentText, guestName);
    setCommentText("");
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-image">
          <img
            src={displayImage}
            alt={article.title}
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-tags">
            <span className="modal-source-badge">
              {article.source?.name || article.category || "Global News"}
            </span>
            <span className="modal-date">
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
                : "Recent"}
            </span>
          </div>

          <h2 className="modal-title">{article.title}</h2>

          {/* Likes & Engagement Bar */}
          <div className="modal-engagement-bar">
            <button
              className={`modal-like-btn ${likesData.userLiked ? "liked" : ""}`}
              onClick={() => toggleLike(article)}
              title={likesData.userLiked ? "Unlike article" : "Like article"}
            >
              <FiHeart />
              <span>
                {likesData.count} {likesData.count === 1 ? "Like" : "Likes"}
              </span>
            </button>

            <a
              href="#modal-comments-anchor"
              className="modal-like-btn"
              style={{ textDecoration: "none" }}
            >
              <FiMessageSquare />
              <span>
                {commentsList.length} {commentsList.length === 1 ? "Comment" : "Comments"}
              </span>
            </a>

            <button
              className={`modal-like-btn ${bookmarked ? "liked" : ""}`}
              onClick={() => toggleBookmark(article, article.category || "modal")}
            >
              <FiBookmark />
              <span>{bookmarked ? "Bookmarked" : "Save"}</span>
            </button>
          </div>

          <div className="audio-player-bar">
            <div className="audio-player-info">
              <FiVolume2 style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
              <span>Audio Narration (Text-to-Speech)</span>
            </div>
            <button className="audio-btn" onClick={handleAudioToggle}>
              {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
              <span>{isSpeaking ? "Stop" : "Listen"}</span>
            </button>
          </div>

          <p className="modal-description">
            {article.description || article.content || "Full synopsis available at original publisher."}
          </p>

          <div className="share-section">
            <h4 className="share-title">Share this article</h4>
            <div className="share-buttons-group">
              <button className="share-btn twitter" onClick={shareToTwitter}>
                <FaTwitter /> Twitter / X
              </button>
              <button className="share-btn linkedin" onClick={shareToLinkedIn}>
                <FaLinkedinIn /> LinkedIn
              </button>
              <button className="share-btn whatsapp" onClick={shareToWhatsApp}>
                <FaWhatsapp /> WhatsApp
              </button>
              <button className="share-btn" onClick={handleCopyLink}>
                {copied ? <FiCheck style={{ color: "#10B981" }} /> : <FiCopy />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>
            {copied && <span className="toast-feedback">Link copied to clipboard!</span>}
          </div>

          {/* Comments & Discussion Section */}
          <div id="modal-comments-anchor" className="comments-section">
            <div className="comments-header">
              <h3 className="comments-title">
                <FiMessageSquare style={{ color: "var(--accent-primary)" }} />
                <span>Discussion & Comments</span>
                <span className="comments-count-pill">{commentsList.length}</span>
              </h3>
            </div>

            {/* Comment Form */}
            <form className="comment-input-box" onSubmit={handleCommentSubmit}>
              <div className="comment-author-row">
                <img
                  src={
                    currentUser?.profilePic
                      ? currentUser.profilePic.startsWith("http")
                        ? currentUser.profilePic
                        : `http://localhost:5000${currentUser.profilePic}`
                      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                  }
                  alt="avatar"
                  className="comment-user-avatar"
                />
                {currentUser ? (
                  <span className="comment-author-name">{currentUser.username}</span>
                ) : (
                  <input
                    type="text"
                    className="comment-guest-input"
                    placeholder="Your Name (optional)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                )}
              </div>

              <textarea
                className="comment-textarea"
                placeholder="What are your thoughts on this story? Leave a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />

              <div className="comment-submit-row">
                <button type="submit" className="comment-post-btn">
                  <FiSend style={{ marginRight: 6 }} /> Post Comment
                </button>
              </div>
            </form>

            {/* Comments List */}
            {commentsList.length === 0 ? (
              <div className="no-comments-prompt">
                💬 No comments yet. Be the first to share your perspective!
              </div>
            ) : (
              <div className="comments-list">
                {commentsList.map((c, i) => (
                  <div key={c._id || i} className="comment-item">
                    <img
                      src={
                        c.userAvatar
                          ? c.userAvatar.startsWith("http")
                            ? c.userAvatar
                            : `http://localhost:5000${c.userAvatar}`
                          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                      }
                      alt={c.username}
                      className="comment-item-avatar"
                    />
                    <div className="comment-item-content">
                      <div className="comment-item-header">
                        <span className="comment-item-username">{c.username}</span>
                        <span className="comment-item-time">
                          {formatCommentDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="comment-item-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ marginTop: 24 }}>
            <button
              className={`icon-action-btn ${likesData.userLiked ? "active" : ""}`}
              onClick={() => toggleLike(article)}
              style={{
                width: "auto",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                gap: 8,
                fontSize: "0.88rem",
                color: likesData.userLiked ? "#F43F5E" : "var(--text-secondary)"
              }}
            >
              <FiHeart />
              <span>{likesData.count} Likes</span>
            </button>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-source-btn"
            >
              <span>Read Original Story</span>
              <FiExternalLink />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;