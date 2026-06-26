import { useEffect, useMemo, useState } from "react";


export default function FallbackImage({
  src,
  alt = "",
  fallbackSrc = "../assets/default-img/ImageNotFound.webp",
  className,
  style,
  imgProps = {},
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const safeFallback = useMemo(() => fallbackSrc || "../assets/default-img/ImageNotFound.webp", [fallbackSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={imgProps.loading ?? "lazy"}
      decoding={imgProps.decoding ?? "async"}
      onError={(e) => {
        // Prevent infinite loop if fallback also fails.
        const img = e?.currentTarget;
        if (!img) return;
        if (img.getAttribute("data-fallback-tried") === "1") return;
        img.setAttribute("data-fallback-tried", "1");
        setCurrentSrc(safeFallback);
      }}
      {...imgProps}
    />
  );
}

