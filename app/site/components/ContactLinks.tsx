import { useSite } from '../site'

// Every way to reach me, in one place for About and the footer.
export function ContactLinks({ className = 'plain' }: { className?: string }) {
  const { profile } = useSite()
  return (
    <ul className={className}>
      <li>
        <a href={`mailto:${profile.email}`} className="link">
          {profile.email}
        </a>
      </li>
      <li>
        <a href={profile.linkedin} className="link">
          LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <a href={profile.github} className="link">
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </li>
      <li>
        <a href={profile.resume} className="link">
          Résumé (PDF) <span aria-hidden="true">↓</span>
        </a>
      </li>
    </ul>
  )
}
