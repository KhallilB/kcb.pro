import '@testing-library/jest-dom/vitest'

// jsdom has no layout; scrolling is a no-op here.
window.scrollTo = () => {}
