import React from "react";
import "./NewsTicker.css";

const DEFAULT_HEADLINES = [
  "Global Tech Summit unveils next-generation quantum computing milestones",
  "Renewable clean energy outpaces fossil fuel generation across key markets",
  "Markets rally as central banks signal economic stability and inflation cooling",
  "Deep space observatories discover molecular biosignatures on distant exoplanet",
  "Next-generation solid state battery begins road endurance tests with 800-mile range"
];

const NewsTicker = ({ articles = [], onSelectArticle }) => {
  const headlines =
    articles && articles.length > 0
      ? articles.slice(0, 8).map((a) => ({
          title: a.title,
          url: a.url,
          article: a
        }))
      : DEFAULT_HEADLINES.map((title) => ({ title, url: "#" }));

  // Duplicate for seamless infinite loop
  const displayHeadlines = [...headlines, ...headlines];

  return (
    <div className="ticker-container">
      <div className="ticker-label">
        <span className="ticker-pulse"></span>
        <span>BREAKING</span>
      </div>
      <div className="ticker-track">
        {displayHeadlines.map((item, index) => (
          <div
            key={index}
            className="ticker-item"
            onClick={() => {
              if (item.article && onSelectArticle) {
                onSelectArticle(item.article);
              } else if (item.url && item.url !== "#") {
                window.open(item.url, "_blank");
              }
            }}
          >
            <span className="ticker-bullet">◆</span>
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsTicker;
