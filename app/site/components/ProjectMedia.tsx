import type { Media } from '@app/portfolio/domain/types'

// Lazy so the header paints first; a video fetches nothing until played.
export function ProjectMedia({ media }: { media: Media }) {
  const { kind, src, alt, width, height } = media
  return (
    <figure className="project-media">
      {kind === 'image' ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          src={src}
          aria-label={alt}
          width={width}
          height={height}
          controls
          playsInline
          preload="none"
        />
      )}
    </figure>
  )
}
