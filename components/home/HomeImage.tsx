'use client';

import { createContext, useContext, type CSSProperties } from 'react';

const HomeImagesContext = createContext<Record<string, string>>({});

export const HomeImagesProvider = HomeImagesContext.Provider;

export function useHomeImages() {
  return useContext(HomeImagesContext);
}

interface HomeImageProps {
  name: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}

export function HomeImage({ name, alt, className, style, priority }: HomeImageProps) {
  const images = useContext(HomeImagesContext);
  const src = images[name];
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
