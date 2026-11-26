import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F5C4D]/10 via-slate-100 to-slate-200 text-[#0F5C4D] ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-7 h-7 opacity-70" />
        {fallbackTitle && (
          <span className="mt-1.5 text-xs font-medium text-slate-600 px-2 text-center">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
