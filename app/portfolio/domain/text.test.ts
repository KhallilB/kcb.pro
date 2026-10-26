import { isShortLine } from './text'

describe('isShortLine', () => {
  it.each([
    ['a short sentence', 'Done.', true],
    ['140 characters', 'x'.repeat(140), true],
    ['140 characters inside padding', `  ${'x'.repeat(140)}  `, true],
    ['141 characters', 'x'.repeat(141), false],
    ['140 emoji, counted as characters', '🙂'.repeat(140), true],
    ['blank', '   ', false],
    ['empty', '', false],
    ['a line feed', 'a\nb', false],
    ['a carriage return', 'a\rb', false],
    ['a trailing line feed', 'Done.\n', false],
    ['not a string', 5, false],
  ])('%s', (_name, text, ok) => {
    expect(isShortLine(text)).toBe(ok)
  })
})
