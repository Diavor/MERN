import { ZodError } from "zod";

// Factory: validate/coerce request parts against zod schemas. On success the
// parsed (typed, defaulted) values replace the originals so controllers can trust
// them. On failure → 422 with field-level messages.
//
//   router.post("/", validate({ body: createOrderSchema }), controller)
const validate = (schemas) => (req, res, next) => {
  try {
    for (const key of ["body", "query", "params"]) {
      if (schemas[key]) {
        const parsed = schemas[key].parse(req[key]);
        // req.query/req.params can be getter-only on some Express versions; assign
        // fields instead of replacing the object wholesale.
        if (key === "body") req.body = parsed;
        else Object.assign(req[key], parsed);
      }
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422);
      const message = err.issues
        .map((i) => `${i.path.join(".") || "value"}: ${i.message}`)
        .join("; ");
      return next(new Error(message));
    }
    next(err);
  }
};

export default validate;
