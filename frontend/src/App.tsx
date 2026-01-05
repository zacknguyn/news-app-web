import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './auth/LoginScreen'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  )
}

export default App
