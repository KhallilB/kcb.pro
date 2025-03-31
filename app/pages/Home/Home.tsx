import { useEffect } from 'react'
import StartGame from '@app/startGame'

export default function Home() {
  useEffect(() => {
    StartGame()
  }, [])

  return (
    <div className="z-20 flex min-h-screen w-full items-center justify-center">
      <p className="font-header text-5xl">Home</p>
    </div>
  )
}
