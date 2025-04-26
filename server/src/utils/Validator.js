import { NotValidError } from '../errors/NotValidError.js';

/**
 * Fields validator.
 */
export class Validator {
  /**
   * Validate user fields.
   *
   * @param user user dto
   * @throws {NotValidError} if user required fields are not valid
   */
  static validateUserDto(user) {
    if (this.isEmail(user.email) && this.isNotEmptyField(user.firstName)) {
      return;
    }

    throw new NotValidError('User required fields are not valid');
  }

  /**
   * Validate user fields.
   *
   * @param user user entity
   * @throws {NotValidError} if user required fields are not valid
   */
  static validateUserEntity(user) {
    if (
      this.isEmail(user.email) &&
      this.isPassword(user.password) &&
      this.isNotEmptyField(user._id) &&
      this.isNotEmptyField(user.firstName) &&
      this.isNotEmptyField(user.role)
    ) {
      return;
    }

    throw new NotValidError('User required fields are not valid');
  }

  /**
   * Validate email.
   *
   * @param email email
   * @returns true if email is valid, false otherwise
   */
  static isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate password.
   *
   * @param password password
   * @returns true if password is valid, false otherwise
   */
  static isPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  }

  /**
   * Validate not empty field.
   *
   * @param field field
   * @returns true if field is not empty, false otherwise
   */
  static isNotEmptyField(field) {
    return field !== undefined && field !== null && field !== '';
  }
}
