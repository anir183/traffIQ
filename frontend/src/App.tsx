import { Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
