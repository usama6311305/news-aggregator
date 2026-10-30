import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("newspulse_theme") || "dark";
  });

  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      const saved = localStorage.getItem("newspulse_saved_articles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("newspulse_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isBookmarked = (url) => {
    return savedArticles.some((article) => article.url === url);
  };

  const toggleBookmark = (article, category = "general") => {
    setSavedArticles((prev) => {
      const exists = prev.some((a) => a.url === article.url);
      let updated;
      if (exists) {
        updated = prev.filter((a) => a.url !== article.url);
      } else {
        const enriched = {
          ...article,
          savedAt: new Date().toISOString(),
          category: category || article.category || "general"
        };
        updated = [enriched, ...prev];
        
        // Also save to backend if user is logged in
        const userId = localStorage.getItem("userId");
        if (userId) {
          fetch("http://localhost:5000/api/interactions/save-interaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, category, article: enriched }),
          }).catch((e) => console.log("Failed to sync bookmark to server:", e));
        }
      }
      localStorage.setItem("newspulse_saved_articles", JSON.stringify(updated));
      return updated;
    });
  };

  const removeBookmark = (url) => {
    setSavedArticles((prev) => {
      const updated = prev.filter((a) => a.url !== url);
      localStorage.setItem("newspulse_saved_articles", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        savedArticles,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
