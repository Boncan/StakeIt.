import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StakeItV7 from './StakeIt-V7'
import StakeItV8 from './StakeIt-V8'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default: V8 Simplified */}
        <Route path="/" element={<StakeItV8 />} />

        {/* V7: 3 Modes (anti-charity, friend, charity) */}
        <Route path="/v7" element={<StakeItV7 />} />

        {/* You can swap the default by changing which component is on "/" */}
      </Routes>
    </BrowserRouter>
  )
}
