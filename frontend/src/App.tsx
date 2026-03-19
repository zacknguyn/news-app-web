import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./auth/LoginScreen";
import "./App.css";
import RegisterScreen from "./auth/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Add more protected routes here as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
