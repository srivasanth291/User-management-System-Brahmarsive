
import { api } from "../api/client";
const progressCache = new Map();
export async function refreshStudentProgress(courses) {
  await Promise.all((courses || []).map(async course => {
    try { progressCache.set(String(course.id), await api(`/api/courses/${course.id}/progress`)); }
    catch { progressCache.delete(String(course.id)); }
  }));
}
export function getStudentProgress(studentId, course) {
  const server = progressCache.get(String(course.id));
  const saved = {
    completedModules: (server?.modules || []).flatMap((m, index) => m.completed ? [index] : []),
    selectedModule: 0
  };

  const totalModules = course.modules?.length || 0;

  const completedModules = [
    ...new Set(
      (Array.isArray(saved.completedModules)
        ? saved.completedModules
        : []
      ).map(Number)
    ),
  ].filter(
    (index) =>
      Number.isInteger(index) &&
      index >= 0 &&
      index < totalModules
  );

  const completedCount = completedModules.length;

  const percentage =
    totalModules > 0
      ? Math.round((completedCount / totalModules) * 100)
      : 0;

  const started =
    completedCount > 0 ||
    saved.selectedModule !== undefined;

  return {
    totalModules,
    completedCount,
    percentage,
    started,
    completed: totalModules > 0 && completedCount === totalModules,
    selectedModule: saved.selectedModule ?? 0,
  };
}

export function getOverallProgress(studentId, courses) {
  if (courses.length === 0) return 0;

  const total = courses.reduce(
    (sum, course) =>
      sum + getStudentProgress(studentId, course).percentage,
    0
  );

  return Math.round(total / courses.length);
}
