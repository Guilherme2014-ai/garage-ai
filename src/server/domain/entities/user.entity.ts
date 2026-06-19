import type { PlanMode } from "@/server/domain/plan/plan-mode";

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string | null;
  image: string | null;
  provider: string | null;
  providerId: string | null;
  planMode: PlanMode;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}
