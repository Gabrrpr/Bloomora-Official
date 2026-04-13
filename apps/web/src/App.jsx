import { useState } from "react";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar";

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <>
      <Navbar cartCount={cartCount} setCartCount={setCartCount} />
      <Home />
    </>
  );
}