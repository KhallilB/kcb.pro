import type { Media } from '@app/portfolio/domain/types'

// Lazy so the header paints first; a video fetches nothing until played.
function Shot({ media }: { media: Media }) {
  const { kind, src, alt, width, height, caption } = media
  return (
    <figure className="shot">
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
      {caption && <figcaption className="shot__caption">{caption}</figcaption>}
    </figure>
  )
}

export function ProjectMedia({ media }: { media: Media[] }) {
  return (
    <div className="project-media" role="group" aria-label="Screenshots">
      {media.map((shot) => (
        <Shot key={shot.src} media={shot} />
      ))}
    </div>
  )
}
