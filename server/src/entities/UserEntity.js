/**
 * User entity.
 */
export class UserEntity {
  constructor(
    _id,
    firstName,
    email,
    password,
    role,
    lastName,
    middleName,
    description,
    birthDate,
    createdAt,
    updatedAt
  ) {
    this._id = _id;
    this.firstName = firstName;
    this.email = email;
    this.password = password;
    this.role = role;
    this.lastName = lastName;
    this.middleName = middleName;
    this.description = description;
    this.birthDate = birthDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static builder() {
    return new UserEntity.UserBuilder();
  }

  /**
   * User builder.
   */
  static UserBuilder = class {
    constructor() {
      this._id = '';
      this.firstName = '';
      this.email = '';
      this.password = undefined;
      this.role = undefined;
      this.lastName = undefined;
      this.middleName = undefined;
      this.description = undefined;
      this.birthDate = undefined;
      this.createdAt = undefined;
      this.updatedAt = undefined;
    }

    setId(id) {
      this._id = id;
      return this;
    }

    setFirstName(firstName) {
      this.firstName = firstName;
      return this;
    }

    setLastName(lastName) {
      this.lastName = lastName;
      return this;
    }

    setMiddleName(middleName) {
      this.middleName = middleName;
      return this;
    }

    setEmail(email) {
      this.email = email;
      return this;
    }

    setPassword(password) {
      this.password = password;
      return this;
    }

    setRole(role) {
      this.role = role;
      return this;
    }

    setDescription(description) {
      this.description = description;
      return this;
    }

    setBirthdate(birthDate) {
      this.birthDate = birthDate;
      return this;
    }

    setCreatedAt(createdAt) {
      this.createdAt = createdAt;
      return this;
    }

    setUpdatedAt(updatedAt) {
      this.updatedAt = updatedAt;
      return this;
    }

    build() {
      if (!this._id || !this.firstName || !this.email) {
        throw new Error('Required fields are missing');
      }

      return new UserEntity(
        this._id,
        this.firstName,
        this.email,
        this.password,
        this.role,
        this.lastName,
        this.middleName,
        this.description,
        this.birthDate,
        this.createdAt,
        this.updatedAt
      );
    }
  };
}
