// BRÀCE — root app

const { useState: useState_root, useEffect: useEffect_root, useMemo: useMemo_root } = React;

function App() {
  const [route, setRoute] = useState_root("home");
  const [productId, setProductId] = useState_root("margherita-dop");
  const [tweaks, setTweaks] = window.useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "ember",
    "surface": "antichi",
    "density": "comfortable",
    "showFloatingCart": true
  }/*EDITMODE-END*/);

  // expose setProduct for cross-component navigation
  useEffect_root(() => {
    window.__app_setProduct = (id) => { setProductId(id); window.scrollTo({ top: 0 }); };
  }, []);

  const go = (r) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Apply tweak overrides
  useEffect_root(() => {
    const root = document.documentElement;
    const accents = {
      ember:   { accent: "#a83920", gold: "#6e4920", goldDeep: "#4a2f10" }, // terracotta / wheat brown
      olive:   { accent: "#5a7a3a", gold: "#6b6028", goldDeep: "#3d3a14" },
      saffron: { accent: "#c47018", gold: "#7a5418", goldDeep: "#4f3508" },
      cobalt:  { accent: "#2a4d99", gold: "#5a4828", goldDeep: "#3a2e16" },
    };
    const surfaces = {
      antichi: {
        bg: "#f1e7d0", bg2: "#e8dab8", bg3: "#ddca9f",
        line: "#cab78b", line2: "#a78f5e",
        text: "#2a1c0a", textDim: "#6a532d", textFaint: "#957a4e",
        scrimBlur: "rgba(241,231,208,0.85)",
        scrimBlurStrong: "rgba(241,231,208,0.92)",
        scrimOverlay: "rgba(40,28,10,0.35)",
        featureCard: "linear-gradient(135deg, #3a2613 0%, #2a1c0a 100%)",
        gridLine: "rgba(74,47,16,0.08)",
        phStripe: "rgba(74,47,16,0.1)",
        phBg1: "#e2d3b0", phBg2: "#cab78b",
        markStroke: "#6e4920",
      },
      warm: {
        bg: "#0e0d0c", bg2: "#181614", bg3: "#211d1a",
        line: "#2a2522", line2: "#3a322d",
        text: "#f3ece2", textDim: "#a8a097", textFaint: "#6b6660",
        scrimBlur: "rgba(14,13,12,0.85)",
        scrimBlurStrong: "rgba(14,13,12,0.92)",
        scrimOverlay: "rgba(0,0,0,0.5)",
        featureCard: "linear-gradient(135deg, #1f1a16 0%, #14110e 100%)",
        gridLine: "#1a1614",
        phStripe: "#1a1614",
        phBg1: "#1f1a16", phBg2: "#14110e",
        markStroke: "#d4a373",
      },
      ink: {
        bg: "#fafaf7", bg2: "#f1efe8", bg3: "#e3dfd2",
        line: "#cfc8b5", line2: "#a89e85",
        text: "#0e0e0e", textDim: "#52524e", textFaint: "#8a8682",
        scrimBlur: "rgba(250,250,247,0.88)",
        scrimBlurStrong: "rgba(250,250,247,0.94)",
        scrimOverlay: "rgba(0,0,0,0.3)",
        featureCard: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        gridLine: "rgba(0,0,0,0.06)",
        phStripe: "rgba(0,0,0,0.06)",
        phBg1: "#ece8db", phBg2: "#d6d0bc",
        markStroke: "#0e0e0e",
      },
    };
    const a = accents[tweaks.accent] || accents.ember;
    const s = surfaces[tweaks.surface] || surfaces.antichi;

    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--gold", a.gold);
    root.style.setProperty("--gold-deep", a.goldDeep);

    root.style.setProperty("--bg", s.bg);
    root.style.setProperty("--bg-2", s.bg2);
    root.style.setProperty("--bg-3", s.bg3);
    root.style.setProperty("--line", s.line);
    root.style.setProperty("--line-2", s.line2);
    root.style.setProperty("--text", s.text);
    root.style.setProperty("--text-dim", s.textDim);
    root.style.setProperty("--text-faint", s.textFaint);

    root.style.setProperty("--scrim-blur", s.scrimBlur);
    root.style.setProperty("--scrim-blur-strong", s.scrimBlurStrong);
    root.style.setProperty("--scrim-overlay", s.scrimOverlay);
    root.style.setProperty("--feature-card", s.featureCard);
    root.style.setProperty("--grid-line", s.gridLine);
    root.style.setProperty("--ph-stripe", s.phStripe);
    root.style.setProperty("--ph-bg-1", s.phBg1);
    root.style.setProperty("--ph-bg-2", s.phBg2);

    root.style.setProperty("--maxw", tweaks.density === "tight" ? "1280px" : "1440px");
  }, [tweaks]);

  // smooth route transition
  return (
    <window.ToastProvider>
      <window.CartProvider>
        <window.Nav route={route} go={go}/>

        <div key={route} className="fade">
          {route === "home" && <window.HomeScreen go={go}/>}
          {route === "menu" && <window.MenuScreen go={go}/>}
          {route === "product" && <window.ProductScreen productId={productId} go={go}/>}
          {route === "story" && <window.StoryScreen go={go}/>}
          {route === "checkout" && <window.CheckoutScreen go={go}/>}
          {route === "account" && <window.AccountScreen go={go}/>}
          {route === "admin" && <window.AdminScreen go={go}/>}
        </div>

        <window.Footer go={go}/>
        <window.CartDrawer go={go}/>
        {tweaks.showFloatingCart && <window.FloatingCart/>}

        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Brand">
            <window.TweakSelect
              label="Accent"
              value={tweaks.accent}
              options={[
                { value: "ember",   label: "Ember red · gold" },
                { value: "olive",   label: "Olive · cream" },
                { value: "saffron", label: "Saffron · honey" },
                { value: "cobalt",  label: "Cobalt · sand" },
              ]}
              onChange={v => setTweaks("accent", v)}
            />
            <window.TweakRadio
              label="Surface"
              value={tweaks.surface}
              options={[
                { value: "antichi", label: "Antichi" },
                { value: "warm",    label: "Notte" },
                { value: "ink",     label: "Carta" },
              ]}
              onChange={v => setTweaks("surface", v)}
            />
            <window.TweakRadio
              label="Density"
              value={tweaks.density}
              options={[
                { value: "comfortable", label: "Comfy" },
                { value: "tight", label: "Tight" },
              ]}
              onChange={v => setTweaks("density", v)}
            />
            <window.TweakToggle
              label="Floating cart"
              value={tweaks.showFloatingCart}
              onChange={v => setTweaks("showFloatingCart", v)}
            />
          </window.TweakSection>

          <window.TweakSection label="Jump to screen">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["home", "Home"],
                ["menu", "Menu"],
                ["product", "Dettaglio"],
                ["checkout", "Checkout"],
                ["account", "Account"],
                ["admin", "Admin"],
                ["story", "Manifesto"],
              ].map(([r, l]) => (
                <button key={r} onClick={() => go(r)} className="btn sm ghost"
                  style={{ justifyContent: "center", padding: "8px 10px", fontSize: 10 }}>{l}</button>
              ))}
            </div>
          </window.TweakSection>
        </window.TweaksPanel>
      </window.CartProvider>
    </window.ToastProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
