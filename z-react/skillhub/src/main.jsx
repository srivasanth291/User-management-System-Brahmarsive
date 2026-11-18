import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CourseMappingProvider } from "./context/CourseMappingContext";

import { AuthProvider } from "./context/AuthContext";
import { CourseProvider } from "./context/CourseContext";
import { UserProvider } from "./context/UserContext.jsx";
document.documentElement.dataset.skillhubTheme =
  localStorage.getItem("skillhub_theme") === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <AuthProvider>
        <CourseProvider>
          <CourseMappingProvider>
            <App />
          </CourseMappingProvider>
        </CourseProvider>
      </AuthProvider>
    </UserProvider>
  </StrictMode>,
);
