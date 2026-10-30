import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiX,
  FiHome,
  FiCpu,
  FiBriefcase,
  FiActivity,
  FiSmile,
  FiRadio,
  FiTrendingUp,
  FiBookmark,
  FiUser
} from "react-icons/fi";
import "./Sidebar.css";

const MENU_ITEMS = [
  { label: "Home", path: "/", icon: <FiHome /> },
  { label: "Technology", path: "/news/technology", icon: <FiCpu /> },
  { label: "Business", path: "/news/business", icon: <FiBriefcase /> },
  { label: "Sports", path: "/news/sports", icon: <FiActivity /> },
  { label: "Health", path: "/news/health", icon: <FiActivity /> },
  { label: "Entertainment", path: "/news/entertainment", icon: <FiSmile /> },
  { label: "Science", path: "/news/science", icon: <FiRadio /> },
  { label: "General", path: "/news/general", icon: <FiTrendingUp /> },
  { label: "Reading List", path: "/saved", icon: <FiBookmark /> },
  { label: "Account Profile", path: "/account", icon: <FiUser /> }
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      <aside className={`modern-sidebar-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700
              }}
            >
              N
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NewsPulse
            </span>
          </div>

          <button className="drawer-close-btn" onClick={onClose} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <ul className="drawer-menu">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className={`drawer-menu-item ${isActive ? "active" : ""}`}>
                <Link to={item.path} onClick={onClose}>
                  <span className="drawer-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="drawer-footer">
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
            NewsPulse © 2026. Real-time News Aggregation.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
