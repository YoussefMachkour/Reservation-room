import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext"; // Add this import
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./AppRouter";
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            {" "}
            {/* Add this wrapper */}
            <AppRouter />
          </NotificationProvider>{" "}
          {/* Close it here */}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
