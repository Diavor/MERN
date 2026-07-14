import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import Loader from "../brace/ui/Loader";
import Meta from "../components/Meta";
import { BlockPreview } from "../brace/admin/pageBlocks";

// Storefront renderer for CMS pages authored in the admin Pages module.
// Fetches the published page by slug and renders its blocks in reading order,
// reusing the same BlockPreview renderer the editor canvas/preview uses.
const PageScreen = ({ match }) => {
  const slug = match.params.slug;
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    axios
      .get(`/api/pages/slug/${slug}`)
      .then(({ data }) => {
        if (!alive) return;
        // Map backend block shape { id, type, data } → editor/preview shape
        // { id, type, props } that BlockPreview expects.
        setPage({
          ...data,
          blocks: (data.blocks || []).map((b) => ({ id: b.id, type: b.type, props: b.data || {} })),
        });
      })
      .catch(() => {
        if (alive) setNotFound(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="b-container" style={{ padding: "160px 0", minHeight: "60vh" }}>
        <Loader />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="b-container" style={{ padding: "160px 0 200px", textAlign: "center", minHeight: "60vh" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Errore 404</div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 8vw, 96px)", lineHeight: 1, margin: 0 }}>
          Pagina non trovata
        </h1>
        <p style={{ color: "var(--text-dim)", marginTop: 20, fontSize: 16 }}>
          La pagina <span className="mono">/{slug}</span> non esiste o non è più pubblicata.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh" }}>
      <Meta
        title={page.seo?.title || page.title || "Grani Antichi"}
        description={page.seo?.description || ""}
        keywords={page.seo?.keywords || ""}
      />
      <article style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingTop: 78 }}>
        {page.blocks.length === 0 ? (
          <div style={{ padding: "160px 40px", textAlign: "center", color: "var(--text-faint)" }}>
            <div className="display" style={{ fontSize: 40 }}>{page.title}</div>
            <p style={{ marginTop: 12 }}>Questa pagina non ha ancora contenuti.</p>
          </div>
        ) : (
          page.blocks.map((b) => (
            <div key={b.id}>
              <BlockPreview block={b} />
            </div>
          ))
        )}
      </article>
    </div>
  );
};

export default PageScreen;
