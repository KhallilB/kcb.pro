import { Link } from 'react-router'

export function NotFound() {
  return (
    <article className="page-head">
      <p className="mono secondary">404</p>
      <h1 className="h1">This page moved or never existed.</h1>
      <p>
        <Link to="/work" className="link">
          Everything I have built <span aria-hidden="true">→</span>
        </Link>
      </p>
    </article>
  )
}
