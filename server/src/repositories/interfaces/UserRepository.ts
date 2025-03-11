import { UserEntity } from '../../entities/UserEntity.ts';

/**
 * User repository interface.
 */
export interface UserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
}
