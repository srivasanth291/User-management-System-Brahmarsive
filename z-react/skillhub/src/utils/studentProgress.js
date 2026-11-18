
export function getStudentProgress(studentId, course) {
  const key = `skillhub_progress_${studentId}_${course.id}`;

  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    saved = {};
  }

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
