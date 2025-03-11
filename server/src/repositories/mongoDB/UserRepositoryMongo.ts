import { UserRepository } from '../interfaces/UserRepository.ts';
import { UserModel } from '../../models/models.ts';
import { UserEntity } from '../../entities/UserEntity.ts';

/**
 * UserRepository implementation for MongoDB.
 */
export class UserRepositoryMongo implements UserRepository {
  /**
   * Create a new user.
   *
   * @param user the user to create
   * @returns the created user
   */
  public async create(user: UserEntity): Promise<UserEntity> {
    const created = await UserModel.create(user);
    return this.transformToEntity(created);
  }

  /**
   * Find a user by email.
   *
   * @param email user email
   * @returns the user or null if not found
   */
  public async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ email }).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Find a user by id.
   *
   * @param id user id
   * @returns the user or null if not found
   */
  public async findById(id: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(id).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Update a user.
   *
   * @param id user id
   * @param data user data
   */
  public async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Delete a user.
   *
   * @param id user id
   * @returns true if the user was deleted, false otherwise
   */
  public async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }

  /**
   * Transform a user to an entity.
   *
   * @param user the user to transform
   * @returns the transformed user
   */
  private transformToEntity(user: UserEntity): UserEntity {
    const { _id, ...rest } = user;
    return {
      ...rest,
      _id: _id.toString(),
    } as UserEntity;
  }
}
