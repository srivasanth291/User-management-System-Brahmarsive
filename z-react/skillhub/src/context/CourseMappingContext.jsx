import { useAuth } from "./AuthContext";
import { createContext, useContext, useEffect, useState } from "react";
import { useCourses } from "./CourseContext";
import { useUsers } from "./UserContext";

const CourseMappingContext = createContext(null);
const STORAGE_KEY = "skillhub_course_mappings";

function getSavedMappings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CourseMappingProvider({ children }) {
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const { courses } = useCourses();

  const [mappings, setMappings] = useState(getSavedMappings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    const courseIds = new Set(courses.map((course) => String(course.id)));
    const userIds = new Set(users.map((user) => String(user.id)));

    setMappings((previous) => {
      const updated = previous.filter(
        (mapping) =>
          courseIds.has(String(mapping.courseId)) &&
          userIds.has(String(mapping.studentId)),
      );

      return updated.length === previous.length ? previous : updated;
    });
  }, [courses, users]);
  function canManageCourse(courseId) {
    const role = (currentUser?.role || "").toLowerCase();

    if (role === "admin") {
      return true;
    }

    if (role !== "staff") {
      return false;
    }

    const staffId = String(currentUser?.id ?? "");

    const staff = users.find((user) => String(user.id) === staffId);

    if (
      !staff ||
      (staff.role || "").toLowerCase() !== "staff" ||
      (staff.status || "Active").toLowerCase() !== "active"
    ) {
      return false;
    }

    const course = courses.find((item) => String(item.id) === String(courseId));

    if (!course) {
      return false;
    }

    return (
      String(course.createdBy ?? "") === staffId ||
      String(course.instructorId ?? "") === staffId
    );
  }
  function assignCourse(studentId, courseId) {
    if (!canManageCourse(courseId)) {
      return {
        ok: false,
        message: "You do not have permission to assign this course.",
      };
    }
    const student = users.find(
      (user) =>
        String(user.id) === String(studentId) &&
        (user.role || "").toLowerCase() === "student" &&
        (user.status || "Active").toLowerCase() === "active",
    );

    if (!student) {
      return { ok: false, message: "Select a valid active student." };
    }

    const course = courses.find((item) => String(item.id) === String(courseId));

    if (!course) {
      return { ok: false, message: "Select a valid published course." };
    }

    const alreadyAssigned = mappings.some(
      (mapping) =>
        String(mapping.studentId) === String(studentId) &&
        String(mapping.courseId) === String(courseId),
    );

    if (alreadyAssigned) {
      return {
        ok: false,
        message: "This course is already assigned to the student.",
      };
    }

    const newMapping = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      studentId: String(studentId),
      courseId: String(courseId),
      assignedAt: new Date().toISOString(),
    };

    setMappings((previous) => {
      const duplicate = previous.some(
        (mapping) =>
          String(mapping.studentId) === String(studentId) &&
          String(mapping.courseId) === String(courseId),
      );

      return duplicate ? previous : [...previous, newMapping];
    });

    return { ok: true, message: "Course assigned successfully." };
  }

  function unassignCourse(mappingId) {
    const mapping = mappings.find(
      (item) => String(item.id) === String(mappingId),
    );

    if (!mapping) {
      return {
        ok: false,
        message: "Course assignment not found.",
      };
    }

    if (!canManageCourse(mapping.courseId)) {
      return {
        ok: false,
        message: "You cannot unassign students from this course.",
      };
    }

    setMappings((previous) =>
      previous.filter((item) => String(item.id) !== String(mappingId)),
    );

    return {
      ok: true,
      message: "Course unassigned successfully.",
    };
  }

  return (
    <CourseMappingContext.Provider
      value={{ mappings, assignCourse, unassignCourse }}
    >
      {children}
    </CourseMappingContext.Provider>
  );
}

export function useCourseMappings() {
  const context = useContext(CourseMappingContext);

  if (!context) {
    throw new Error(
      "useCourseMappings must be used inside CourseMappingProvider",
    );
  }

  return context;
}
