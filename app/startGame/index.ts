import { Application, Assets, Sprite } from 'pixi.js'

export default async function StartGame() {
  // Create a new application
  const app = new Application()

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window })

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas)

  // Load the bunny texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png')

  // Make the canvas take the full window absolutely
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.position = 'absolute'
  app.canvas.style.top = '0'
  app.canvas.style.left = '0'
  app.canvas.style.zIndex = '0'
  app.canvas.style.opacity = '.1'

  // Create a bunny Sprite
  const bunny = new Sprite(texture)

  // Center the sprite's anchor point
  bunny.anchor.set(0.5)

  // Move the sprite to the center of the screen
  bunny.x = app.screen.width / 2
  bunny.y = app.screen.height / 2

  app.stage.addChild(bunny)

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime
  })
}
