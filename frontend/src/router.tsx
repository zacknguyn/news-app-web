import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.tsx";
import HomeScreen from "./screens/HomeScreen.tsx";
import LoginScreen from "./auth/LoginScreen.tsx";
import RegisterScreen from "./auth/RegisterScreen.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/register", 
    element: <RegisterScreen />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomeScreen /> },
      { path: "home", element: <HomeScreen /> },
      { path: "posts", element: <div>Posts Page</div> },
      { path: "archive", element: <div>Archive Page</div> },
      { path: "sources", element: <div>Sources Page</div> },
      { path: "network", element: <div>Network Page</div> },
      { path: "community", element: <div>Community Page</div> },
    ],
  },
]);

export default router;
