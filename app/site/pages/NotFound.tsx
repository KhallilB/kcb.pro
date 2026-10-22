import { Link } from 'react-router'

export function NotFound() {
  return (
    <article className="page-head">
      <p className="mono secondary">404</p>
      <h1 className="h1">There’s nothing at this address.</h1>
      <p>
        <Link to="/work" className="link">
          See all my work <span aria-hidden="true">→</span>
        </Link>
      </p>
    </article>
  )
}
