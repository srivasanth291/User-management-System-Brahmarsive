import { createContext, useContext } from "react";

export const UserContext = createContext(null);

export function useUsers() {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUsers must be used inside UserProvider");
  return value;
}
