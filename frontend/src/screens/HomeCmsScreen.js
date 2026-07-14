import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import Meta from "../components/Meta";
import HomeScreen from "./HomeScreen";
import { BlockPreview } from "../brace/admin/pageBlocks";

// The home page is CMS-driven: it renders the published page with slug "home"
// authored in the admin Pages module. If that page doesn't exist yet (fresh
// install, or an admin deleted it), we fall back to the hand-built HomeScreen so
// the site is never blank.
const HomeCmsScreen = (props) => {
  const [state, setState] = useState({ loading: true, page: null });

  useEffect(() => {
    let alive = true;
    axios
      .get("/api/pages/slug/home")
      .then(({ data }) => {
        if (!alive) return;
        setState({
          loading: false,
          page: {
            ...data,
            blocks: (data.blocks || []).map((b) => ({ id: b.id, type: b.type, props: b.data || {} })),
          },
        });
      })
      .catch(() => {
        if (alive) setState({ loading: false, page: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  // While loading, render nothing (avoids a flash of the fallback home).
  if (state.loading) return null;

  // No CMS home page → use the original hand-built homepage.
  if (!state.page) return <HomeScreen {...props} />;

  return (
    <div>
      <Meta
        title={state.page.seo?.title || state.page.title || "Pizzeria Grani Antichi"}
        description={state.page.seo?.description || "Sforniamo pizze di qualità dal 2017 — Mogliano Veneto."}
        keywords={state.page.seo?.keywords || "pizzeria, mogliano veneto, grani antichi"}
      />
      <article style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingTop: 78 }}>
        {state.page.blocks.map((b) => (
          <div key={b.id}>
            <BlockPreview block={b} />
          </div>
        ))}
      </article>
    </div>
  );
};

export default HomeCmsScreen;
