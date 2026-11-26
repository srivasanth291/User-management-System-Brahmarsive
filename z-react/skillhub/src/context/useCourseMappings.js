import { createContext, useContext } from "react";

export const CourseMappingContext = createContext(null);

export function useCourseMappings() {
  const value = useContext(CourseMappingContext);
  if (!value) throw new Error("useCourseMappings must be used inside CourseMappingProvider");
  return value;
}
