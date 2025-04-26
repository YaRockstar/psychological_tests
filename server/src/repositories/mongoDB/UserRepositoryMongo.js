import { UserModel } from '../../models/models.js';

/**
 * UserRepository implementation for MongoDB.
 */
export class UserRepositoryMongo {
  /**
   * Create a new user.
   *
   * @param user the user to create
   * @returns the created user
   */
  async create(user) {
    const created = await UserModel.create(user);
    return this.transformToEntity(created);
  }

  /**
   * Find a user by email.
   *
   * @param email user email
   * @returns the user or null if not found
   */
  async findByEmail(email) {
    const user = await UserModel.findOne({ email }).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Find a user by id.
   *
   * @param id user id
   * @returns the user or null if not found
   */
  async findById(id) {
    const user = await UserModel.findById(id).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Update a user.
   *
   * @param id user id
   * @param data user data
   */
  async update(id, data) {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
    return user ? this.transformToEntity(user) : null;
  }

  /**
   * Delete a user.
   *
   * @param id user id
   * @returns true if the user was deleted, false otherwise
   */
  async delete(id) {
    const result = await UserModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }

  /**
   * Transform a user to an entity.
   *
   * @param user the user to transform
   * @returns the transformed user
   */
  transformToEntity(user) {
    const { _id, ...rest } = user;
    return {
      ...rest,
      _id: _id.toString(),
    };
  }
}
