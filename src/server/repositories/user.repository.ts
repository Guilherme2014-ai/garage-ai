import type { UserEntity } from "@/server/domain/entities";

const users: UserEntity[] = [];

export const userRepository = {
  async findAll(): Promise<UserEntity[]> {
    return [...users];
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    return users.find((u) => u.email === email) ?? null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    return users.find((u) => u.id === id) ?? null;
  },

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<UserEntity | null> {
    return (
      users.find(
        (u) => u.provider === provider && u.providerId === providerId,
      ) ?? null
    );
  },

  async create(
    userData: Omit<UserEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserEntity> {
    const entity: UserEntity = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(entity);
    return entity;
  },

  async update(
    id: string,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...userData, updatedAt: new Date() };
    return users[index];
  },

  async delete(id: string): Promise<boolean> {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  },
};
