import type { UserEntity } from "@/server/domain/entities";
import type { UserPublicViewModel, UserViewModel } from "../user.model";

export const userMapper = {
  toViewModel(entity: UserEntity): UserViewModel {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      image: entity.image,
      provider: entity.provider,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },

  toPublicViewModel(entity: UserEntity): UserPublicViewModel {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      image: entity.image,
      provider: entity.provider,
    };
  },
};
