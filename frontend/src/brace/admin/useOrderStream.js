import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

// Subscribe to the admin live order stream (SSE). Fires `onEvent(payload)` for
// every {type:"created"|"updated", order} frame and plays a short chime on new
// orders. One EventSource per hook instance; it reconnects automatically (the
// server sends a `retry` hint). Auth travels in the query string because the
// EventSource API cannot set an Authorization header.
//
// @param {{ onEvent?: (payload: object) => void, sound?: boolean }} opts

// Lazily-created shared AudioContext (browsers cap the count; reuse one).
let audioCtx = null;
const chime = () => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    o.start();
    o.stop(audioCtx.currentTime + 0.36);
  } catch {
    /* autoplay policy may block until first user gesture — non-fatal */
  }
};

export default function useOrderStream({ onEvent, sound = true } = {}) {
  const { userInfo } = useSelector((s) => s.userLogin);
  const token = userInfo?.token;
  // Keep the latest callback without re-opening the stream on every render.
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (!token) return undefined;
    const es = new EventSource(`/api/orders/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (e) => {
      let payload;
      try {
        payload = JSON.parse(e.data);
      } catch {
        return;
      }
      if (payload.type === "created" && sound) chime();
      if (payload.type === "created" || payload.type === "updated") cbRef.current?.(payload);
    };
    // On error the browser auto-reconnects per the server `retry` hint; no-op.
    es.onerror = () => {};

    return () => es.close();
  }, [token, sound]);
}
