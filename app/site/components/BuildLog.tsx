// Empty until the repo and changelog are wired in; says so rather than showing a stand-in image.
export function BuildLog() {
  return (
    <section className="build-log" aria-labelledby="build-log">
      <h2 id="build-log" className="build-log__title">
        Build log
      </h2>
      <p className="build-log__empty">
        Nothing linked yet. Commits and the changelog show here once the
        GitHub repo is connected.
      </p>
    </section>
  )
}
