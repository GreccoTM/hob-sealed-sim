import { useState } from "react";

interface CardImageProps {
  src: string;
  alt: string;
  title?: string;
  onClick?: () => void;
  className?: string;
}

const MAX_RETRIES = 3;

export function CardImage({ src, alt, title, onClick, className }: CardImageProps) {
  const [attempt, setAttempt] = useState(0);

  function handleError() {
    if (attempt < MAX_RETRIES) {
      setTimeout(() => setAttempt((a) => a + 1), 500 * (attempt + 1));
    }
  }

  const finalSrc = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;

  return (
    <img
      src={finalSrc}
      alt={alt}
      title={title}
      onClick={onClick}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
