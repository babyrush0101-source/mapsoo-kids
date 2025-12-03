import React, { useState } from 'react';

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function BlogImage({ src, alt, caption, className = '' }: BlogImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={className}>
      <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-[#2B4C7E] rounded-full animate-spin" />
          </div>
        )}
        
        {hasError ? (
          <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-auto"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            loading="lazy"
          />
        )}
      </div>
      
      {caption && !hasError && (
        <p className="text-center text-sm text-gray-500 mt-3 italic">
          {caption}
        </p>
      )}
    </div>
  );
}
