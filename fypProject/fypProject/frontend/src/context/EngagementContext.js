import React, { createContext, useContext, useState, useEffect } from "react";

const EngagementContext = createContext();

export const EngagementProvider = ({ children }) => {
  // Store likes: { [url]: { count: number, userLiked: boolean } }
  const [likes, setLikes] = useState(() => {
    try {
      const stored = localStorage.getItem("newspulse_likes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Store comments: { [url]: [ { id, username, userAvatar, text, createdAt } ] }
  const [comments, setComments] = useState(() => {
    try {
      const stored = localStorage.getItem("newspulse_comments");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Stable client/user id
  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      let guestId = localStorage.getItem("newspulse_guest_id");
      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("newspulse_guest_id", guestId);
      }
      return guestId;
    }
    return id;
  };

  useEffect(() => {
    localStorage.setItem("newspulse_likes", JSON.stringify(likes));
  }, [likes]);

  useEffect(() => {
    localStorage.setItem("newspulse_comments", JSON.stringify(comments));
  }, [comments]);

  const getLikes = (url) => {
    return likes[url] || { count: 0, userLiked: false };
  };

  const getComments = (url) => {
    return comments[url] || [];
  };

  // Toggle Like with backend sync and instant local update
  const toggleLike = async (article) => {
    if (!article || !article.url) return;
    const url = article.url;
    const current = likes[url] || { count: 0, userLiked: false };
    const nextUserLiked = !current.userLiked;
    const nextCount = nextUserLiked ? current.count + 1 : Math.max(0, current.count - 1);

    // Instant optimistic update
    setLikes((prev) => ({
      ...prev,
      [url]: { count: nextCount, userLiked: nextUserLiked }
    }));

    // Server sync
    const userId = getUserId();
    try {
      const res = await fetch("http://localhost:5000/api/interactions/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: url,
          articleTitle: article.title || "",
          userId
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikes((prev) => ({
          ...prev,
          [url]: { count: data.likesCount, userLiked: data.liked }
        }));
      }
    } catch (e) {
      // Local state is preserved
    }
  };

  // Add Comment with backend sync and instant local update
  const addComment = async (article, text, guestName = "") => {
    if (!article || !article.url || !text.trim()) return;
    const url = article.url;

    let user = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) user = JSON.parse(raw);
    } catch {}

    const username = user?.username || guestName.trim() || "News Reader";
    const userAvatar = user?.profilePic || "";
    const userId = getUserId();

    const newComment = {
      _id: "c_" + Date.now(),
      userId,
      username,
      userAvatar,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setComments((prev) => {
      const currentList = prev[url] || [];
      return {
        ...prev,
        [url]: [newComment, ...currentList]
      };
    });

    // Server sync
    try {
      const res = await fetch("http://localhost:5000/api/interactions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: url,
          articleTitle: article.title || "",
          userId,
          username,
          userAvatar,
          text: text.trim()
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments((prev) => ({
            ...prev,
            [url]: data.comments
          }));
        }
      }
    } catch (e) {
      // Local state is preserved
    }
  };

  // Fetch engagement for an article on modal open
  const loadEngagement = async (url) => {
    if (!url) return;
    try {
      const res = await fetch(`http://localhost:5000/api/interactions/engagement?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        const userId = getUserId();
        const userLiked = Array.isArray(data.likedBy) && data.likedBy.includes(userId);
        setLikes((prev) => ({
          ...prev,
          [url]: { count: data.likesCount || 0, userLiked }
        }));
        if (data.comments) {
          setComments((prev) => ({
            ...prev,
            [url]: data.comments
          }));
        }
      }
    } catch (e) {}
  };

  return (
    <EngagementContext.Provider
      value={{
        getLikes,
        getComments,
        toggleLike,
        addComment,
        loadEngagement
      }}
    >
      {children}
    </EngagementContext.Provider>
  );
};

export const useEngagement = () => useContext(EngagementContext);
