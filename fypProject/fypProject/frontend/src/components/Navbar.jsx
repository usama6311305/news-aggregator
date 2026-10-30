import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FiSearch,
  FiSun,
  FiMoon,
  FiBookmark,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiCpu,
  FiBriefcase,
  FiActivity,
  FiSmile,
  FiGlobe,
  FiRadio,
  FiZap
} from "react-icons/fi";
import "./Navbar.css";

const CATEGORIES = [
  { id: "all", label: "All News", path: "/", icon: <FiGlobe /> },
  { id: "personal", label: "For You ✨", path: "/personal", icon: <FiZap /> },
  { id: "technology", label: "Technology", path: "/news/technology", icon: <FiCpu /> },
  { id: "business", label: "Business", path: "/news/business", icon: <FiBriefcase /> },
  { id: "sports", label: "Sports", path: "/news/sports", icon: <FiActivity /> },
  { id: "health", label: "Health", path: "/news/health", icon: <FiActivity /> },
  { id: "entertainment", label: "Entertainment", path: "/news/entertainment", icon: <FiSmile /> },
  { id: "science", label: "Science", path: "/news/science", icon: <FiRadio /> },
  { id: "general", label: "General", path: "/news/general", icon: <FiTrendingUp /> }
];

const Navbar = ({ onToggleSidebar, isSidebarOpen, onSearch }) => {
  const { theme, toggleTheme, savedArticles } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    // Format date nicely
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setCurrentDateStr(today.toLocaleDateString(undefined, options));

    // Safely check logged-in user
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userInterests");
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  const getActiveCategory = () => {
    if (location.pathname === "/") return "all";
    if (location.pathname === "/personal") return "personal";
    const parts = location.pathname.split("/");
    return parts[2] || "all";
  };

  const activeCategory = getActiveCategory();

  return (
    <header className="navbar-container">
      <div className="navbar-top">
        {/* Left: Mobile Toggle & Brand */}
        <div className="brand-section">
          <button
            className="mobile-nav-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>

          <Link to="/" className="brand-logo-link">
            <div className="brand-icon-box">
              <FiTrendingUp />
            </div>
            <div>
              <span className="brand-title">NewsPulse</span>
              <span className="brand-badge">PRO</span>
            </div>
          </Link>

          <div className="meta-widget">
            <span>📅 {currentDateStr}</span>
            <div className="weather-badge">
              <span>⛅ 24°C</span>
            </div>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="navbar-center">
          <form className="search-bar-wrapper" onSubmit={handleSearchSubmit}>
            <FiSearch className="search-icon-btn" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search global news, topics, or keywords..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  if (onSearch) onSearch("");
                }}
              >
                <FiX />
              </button>
            )}
          </form>
        </div>

        {/* Right: Actions, Bookmarks, Theme, User */}
        <div className="navbar-actions">
          {/* Saved Articles */}
          <Link
            to="/saved"
            className="icon-action-btn"
            title="Reading List / Saved Articles"
          >
            <FiBookmark />
            {savedArticles.length > 0 && (
              <span className="action-count-badge">
                {savedArticles.length}
              </span>
            )}
          </Link>

          {/* Dark / Light Mode Switch */}
          <button
            className="icon-action-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>

          {/* User Auth / Profile */}
          {currentUser ? (
            <div style={{ position: "relative" }}>
              <button
                className="user-profile-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <img
                  src={
                    currentUser.profilePic
                      ? currentUser.profilePic.startsWith("http")
                        ? currentUser.profilePic
                        : `http://localhost:5000${currentUser.profilePic}`
                      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                  }
                  alt={currentUser.username}
                  className="user-nav-avatar"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                  }}
                />
                <span className="user-nav-name">{currentUser.username}</span>
              </button>

              {isUserMenuOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "115%",
                    width: 220,
                    borderRadius: "var(--radius-md)",
                    padding: 8,
                    zIndex: 2000,
                    boxShadow: "var(--shadow-lg)"
                  }}
                >
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-light)" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{currentUser.username}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentUser.email}
                    </p>
                  </div>
                  <div style={{ padding: "6px 0" }}>
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)"
                      }}
                    >
                      <FiUser /> Profile Settings
                    </Link>
                    <Link
                      to="/saved"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)"
                      }}
                    >
                      <FiBookmark /> Saved Articles ({savedArticles.length})
                    </Link>
                    <Link
                      to="/personal"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)"
                      }}
                    >
                      <FiTrendingUp /> For You Feed
                    </Link>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 6 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "#EF4444",
                        background: "transparent",
                        textAlign: "left"
                      }}
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-nav-group">
              <Link to="/login" className="btn-nav-outline">
                Sign In
              </Link>
              <Link to="/signup" className="btn-nav-gradient">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Categories Bar */}
      <nav className="categories-bar">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={cat.path}
            className={`category-chip ${activeCategory === cat.id ? "active" : ""}`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;
