import { useState } from "react"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import ChatWidget from "./components/ChatWidget"

export default function App() {
  const [cartCount, setCartCount] = useState(0)
  return (
    <>
      <Navbar cartCount={cartCount} setCartCount={setCartCount} />
      <Home />
      <ChatWidget />
    </>
  )
}