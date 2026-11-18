import StudentCourses from "./pages/StudentCourses";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StaffStudents from "./pages/StaffStudents";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffCourseMapping from "./pages/StaffCourseMapping";
import Login from "./pages/Login";
import StudentCoursePlayer from "./pages/StudentCoursePlayer";
import SetPassword from "./pages/SetPassword";
import StaffCreateCourse from "./pages/StaffCreateCourse";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseMapping from "./pages/AdminCourseMapping";
import AdminProfile from "./pages/AdminProfile";
import AdminSettings from "./pages/AdminSettings";
import StaffProfile from "./pages/StaffProfile";
import StaffSettings from "./pages/StaffSettings";
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/StaffDashboard";
import StaffCourses from "./pages/StaffCourses";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentSettings from "./pages/StudentSettings";
import StaffCourseGuard from "./components/StaffCourseGuard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="course-mapping" element={<AdminCourseMapping />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRole="staff">
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="courses" element={<StaffCourses />} />
          <Route
            path="courses/create"
            element={
              <StaffCourseGuard>
                <StaffCreateCourse />
              </StaffCourseGuard>
            }
          />
          <Route path="students" element={<StaffStudents />} />
          <Route path="course-mapping" element={<StaffCourseMapping />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="settings" element={<StaffSettings />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:courseId" element={<StudentCoursePlayer />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="settings" element={<StudentSettings />} />{" "}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
