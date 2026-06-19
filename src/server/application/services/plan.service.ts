import {
  DEFAULT_PLAN_MODE,
  type PlanMode,
} from "@/server/domain/plan/plan-mode";
import { userRepository } from "@/server/repositories";

/**
 * Resolves the plan mode a request should be served under. Plans live on the
 * user row (billing is not wired up yet), so this reads from the user store and
 * falls back to the default plan when the user can't be found.
 */
export const planService = {
  async getPlanModeForUserId(id: string): Promise<PlanMode> {
    const user = await userRepository.findById(id);
    return user?.planMode ?? DEFAULT_PLAN_MODE;
  },

  async getPlanModeForEmail(email: string): Promise<PlanMode> {
    const user = await userRepository.findByEmail(email);
    return user?.planMode ?? DEFAULT_PLAN_MODE;
  },
};
