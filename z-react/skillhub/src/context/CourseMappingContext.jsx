import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api, postJson } from "../api/client";
import { useAppSelector } from "../store/hooks";
const CourseMappingContext = createContext(null);
export function CourseMappingProvider({ children }) {
  const { currentUser } = useAuth();
  const courses = useAppSelector(state => state.courses.items);
  const [mappings, setMappings] = useState([]);
  const refreshMappings = useCallback(async () => {
    if (!currentUser) { setMappings([]); return; }
    if (currentUser.role === "student") {
      const result = await api("/api/students/me/courses");
      setMappings((result.courses || []).map(course => ({ id: `student-${course.id}`, studentId: String(currentUser.id), courseId: String(course.id) })));
      return;
    }
    const responses = await Promise.all(courses.filter(c => Number.isInteger(Number(c.id))).map(async course => {
      try {
        const result = await api(`/api/courses/${course.id}/enrollments`);
        return (result.students || []).map(student => ({ id: student.enrollmentId, studentId: String(student.id), courseId: String(course.id), assignedAt: null }));
      } catch (error) { console.error(error); return []; }
    }));
    setMappings(responses.flat());
  }, [currentUser?.id, currentUser?.role, courses]);
  useEffect(() => { refreshMappings().catch(console.error); }, [refreshMappings]);
  async function assignCourse(studentId, courseId) {
    try {
      await api(`/api/courses/${courseId}/enrollments`, postJson({ studentId: Number(studentId) }));
      await refreshMappings();
      return { ok: true, message: "Course assigned successfully." };
    } catch (error) { return { ok: false, message: error.message }; }
  }
  async function unassignCourse(mappingId) {
    const mapping = mappings.find(item => String(item.id) === String(mappingId));
    if (!mapping) return { ok: false, message: "Assignment not found." };
    try {
      await api(`/api/courses/${mapping.courseId}/enrollments/${mapping.studentId}`, { method: "DELETE" });
      await refreshMappings();
      return { ok: true, message: "Course unassigned successfully." };
    } catch (error) { return { ok: false, message: error.message }; }
  }
  return <CourseMappingContext.Provider value={{ mappings, assignCourse, unassignCourse, refreshMappings }}>{children}</CourseMappingContext.Provider>;
}
export function useCourseMappings() {
  const value = useContext(CourseMappingContext);
  if (!value) throw new Error("useCourseMappings must be used inside CourseMappingProvider");
  return value;
}
