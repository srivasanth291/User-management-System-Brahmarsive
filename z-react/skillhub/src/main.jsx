import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CourseMappingProvider } from "./context/CourseMappingContext";
import { Provider } from "react-redux";
import { store } from "./store";
import { fetchCourses, clearCourses } from "./store/slices/coursesSlice";
window.addEventListener("skillhub-auth-change", () => { store.dispatch(fetchCourses()); });
window.addEventListener("skillhub-session-expired", () => { store.dispatch(clearCourses()); });
if (sessionStorage.getItem("skillhub_access_token")) store.dispatch(fetchCourses());
import { AuthProvider } from "./context/AuthContext";

import { UserProvider } from "./context/UserContext.jsx";
document.documentElement.dataset.skillhubTheme =
  localStorage.getItem("skillhub_theme") === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <UserProvider>
        <AuthProvider>
          <CourseMappingProvider>
            <App />
          </CourseMappingProvider>
        </AuthProvider>
      </UserProvider>
    </Provider>
  </StrictMode>,
);