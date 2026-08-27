import React from "react";
import { useTranslation } from "react-i18next";
import "./StoryScreen.scss";

// Grani Antichi manifesto / story page (static copy, translated).
const PILLARS = [
  ["01", "story.pillar1Title", "story.pillar1Desc"],
  ["02", "story.pillar2Title", "story.pillar2Desc"],
  ["03", "story.pillar3Title", "story.pillar3Desc"],
];

const StoryScreen = () => {
  const { t } = useTranslation();
  return (
    <main className="story">
      <div className="b-container">
        <div className="eyebrow story__eyebrow">{t("story.eyebrow")}</div>
        <h1 className="display story__title">
          {t("story.title")}
          <br />
          <span className="it story__title-accent">{t("story.titleAccent")}</span>
        </h1>
        <p className="it story__lede">{t("story.lede")}</p>

        <div className="story__pillars">
          {PILLARS.map(([n, titleKey, descKey]) => (
            <div key={n} className="story__pillar">
              <div className="mono story__pillar-num">· {n}</div>
              <h3 className="display story__pillar-title">{t(titleKey)}</h3>
              <p className="story__pillar-desc">{t(descKey)}</p>
            </div>
          ))}
        </div>

        <div className="story__quote">
          <p className="it story__quote-text">{t("story.quote")}</p>
          <div className="story__quote-cite">
            Antonio Sannino · {t("story.quoteCite")}
          </div>
        </div>
      </div>
    </main>
  );
};

export default StoryScreen;
