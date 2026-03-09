import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Customer from "./pages/Customer"
import History from "./pages/History"

function App() {

  return (

    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/customer/:account" element={<Customer />} />

      <Route path="/history/:account" element={<History />} />

    </Routes>

  )

}

export default App