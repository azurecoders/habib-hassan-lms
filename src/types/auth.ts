export type UserRole =
  | "SUPER_ADMIN"
  | "INSTITUTION_ADMIN"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string | null;
  schoolSlug?: string | null;
  schoolName?: string | null;
  avatar?: string;
}

export interface JWTPayloadData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string | null;
  schoolSlug?: string | null;
  schoolName?: string | null;
  [key: string]: unknown;
}
