import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PoolProvider } from "./state/PoolContext.js";
import { AuthProvider } from "./state/authContext.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { NavBar } from "./components/NavBar.js";
import { PoolNew } from "./routes/PoolNew.js";
import { DeckBuilder } from "./routes/DeckBuilder.js";
import { Practice } from "./routes/Practice.js";
import { Match } from "./routes/Match.js";
import { Login } from "./routes/Login.js";
import { Signup } from "./routes/Signup.js";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <PoolProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PoolNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deck"
              element={
                <ProtectedRoute>
                  <DeckBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice"
              element={
                <ProtectedRoute>
                  <Practice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/match/:code"
              element={
                <ProtectedRoute>
                  <Match />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </PoolProvider>
    </AuthProvider>
  );
}

export default App;
