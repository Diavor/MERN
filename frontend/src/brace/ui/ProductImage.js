import React, { useState } from "react";

// Product photo with graceful fallback to the CSS pizza-plate placeholder
// (seed data points at /img/pizza-*.jpg which may not exist on disk).
const ProductImage = ({ src, alt, style }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="pizza-plate" style={style}>
        <div className="crust-glow" />
      </div>
    );
  }
  return (
    <img
      className="pizza-photo"
      src={src}
      alt={alt}
      style={style}
      onError={() => setFailed(true)}
    />
  );
};

export default ProductImage;
