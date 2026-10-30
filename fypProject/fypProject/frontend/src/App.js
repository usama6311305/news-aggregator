import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { EngagementProvider } from "./context/EngagementContext";
import Navbar from "./components/Navbar";
import Sidebar from "./Sidebar";
import Home from "./Home";
import SignUp from "./SignUp";
import Login from "./Login";
import NewsFeed from "./components/NewsFeed";
import SavedInteractions from "./components/SavedInteractions";
import Account from "./Account";
import PersonalizedNews from "./components/PersonalizedNews";
import UserRecommendations from "./components/UserRecommendations";
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <EngagementProvider>
        <Router>
          <div className="app-layout">
            {/* Top Sticky Navbar */}
            <Navbar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Off-canvas Responsive Sidebar Drawer */}
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main App Routes */}
            <main className="app-main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/news/:category" element={<NewsFeed />} />
                <Route path="/saved" element={<SavedInteractions />} />
                <Route path="/interest" element={<SavedInteractions />} />
                <Route path="/account" element={<Account />} />
                <Route path="/personal" element={<NewsFeed forceMode="personalized" />} />
                <Route path="/recommend" element={<UserRecommendations />} />
              </Routes>
            </main>
          </div>
        </Router>
      </EngagementProvider>
    </ThemeProvider>
  );
};

export default App;
