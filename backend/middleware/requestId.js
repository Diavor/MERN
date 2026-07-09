import { randomUUID } from "crypto";

// Attach a stable id to every request for end-to-end tracing. Honour an inbound
// X-Request-Id (set by an upstream proxy/LB) so a trace spans the whole edge.
const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id =
    typeof incoming === "string" && incoming.length <= 200 ? incoming : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

export default requestId;
