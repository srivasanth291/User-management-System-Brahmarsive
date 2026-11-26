import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { api, postJson } from "../api/client";
import { useAppSelector } from "../store/hooks";
import { CourseMappingContext } from "./useCourseMappings";
export function CourseMappingProvider({ children }) {
  const { currentUser } = useAuth();
  return <MappingState key={currentUser?.id} currentUser={currentUser}>{children}</MappingState>;
}
function MappingState({ currentUser, children }) {
  const courses = useAppSelector(state => state.courses.items);
  const [mappings, setMappings] = useState([]);
  const loadMappings = useCallback(async () => {
    if (!currentUser) return [];
    if (currentUser.role === "student") {
      const result = await api("/api/students/me/courses");
      return (result.courses || []).map(course => ({ id: `student-${course.id}`, studentId: String(currentUser.id), courseId: String(course.id) }));
    }
    if (currentUser.role === "staff" && !currentUser.permissions?.includes("view_students")) return [];
    const responses = await Promise.all(courses.filter(c => Number.isInteger(Number(c.id))).map(async course => {
      try {
        const result = await api(`/api/courses/${course.id}/enrollments`);
        return (result.students || []).map(student => ({ id: student.enrollmentId, studentId: String(student.id), courseId: String(course.id), assignedAt: null, progress: student.progressPercentage }));
      } catch (error) { console.error(error); return []; }
    }));
    return responses.flat();
  }, [currentUser, courses]);
  useEffect(() => {
    let active = true;
    loadMappings().then(rows => { if (active) setMappings(rows); }).catch(console.error);
    return () => { active = false; };
  }, [loadMappings]);
  async function refreshMappings() { setMappings(await loadMappings()); }
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
