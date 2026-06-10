import { apiSuccess } from "@/lib/api/api-response";
import { userRepository } from "@/server/repositories";

export async function GET() {
  const users = await userRepository.findAll();

  const sanitized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    createdAt: u.createdAt,
  }));

  return apiSuccess(sanitized);
}
