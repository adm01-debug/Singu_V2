import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

/**
 * Componente de imagem otimizado com suporte a:
 * - Lazy loading nativo
 * - Decoding assíncrono
 * - Placeholder de loading (Skeleton)
 * - Fallback para erros
 */
export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = '/placeholder-avatar.png',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && <Skeleton className="absolute inset-0 z-10" />}
      
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}