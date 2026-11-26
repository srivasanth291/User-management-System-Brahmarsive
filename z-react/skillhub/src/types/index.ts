export type Role = "admin" | "staff" | "student";

export type UserStatus = "Active" | "Pending" | "Deactivated";

export const PERMISSIONS = [
  "Create Course",
  "Add Student",
  "Manage Users",
  "View Reports",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // temporary: goes away when a real backend is added
  role: Role;
  status?: UserStatus; // seed users have no status (treated as "Active")
  permissions?: Permission[];
  phone?: string;
  inviteToken?: string | null;
  invitedAt?: string;
  lastLogin?: string | null;
}


export type SafeUser = Omit<User, "password" | "inviteToken">;

export interface QuizQuestion {
  question: string;
  options: Record<string, string>;
  correct: string;
}

export interface Module {
  id?: number;
  moduleTitle: string;
  videoTitle: string;
  videoUrl: string;
  blogText: string;
  quizzes: QuizQuestion[]; // exactly 3 per module
}

export interface Course {
  status?: "draft" | "published" | "archived";
  id: string;
  title: string;
  category: string;
  instructor: string;
  instructorId?: string;
  createdBy?: string;
  description: string;
  thumbnailUrl: string;
  modules: Module[];
}

export interface CourseMapping {
  id: string;
  studentId: string;
  courseId: string;
  assignedAt: string;
}

export interface StudentProgress {
  selectedModule: number;
  completedModules: number[];
  scores: Record<number, number>;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}