import { authService } from "@/server/application/services";
import type { SignUpInput } from "@/server/application/services/auth.service";

export async function signUp(data: SignUpInput) {
  return authService.signUp(data);
}
