/**
 * User DTO.
 */
export class UserDto {
  constructor(firstName, email, id, role, lastName, middleName) {
    this.firstName = firstName;
    this.email = email;
    this.id = id;
    this.role = role;
    this.lastName = lastName;
    this.middleName = middleName;
  }

  static builder() {
    return new UserDto.UserDtoBuilder();
  }

  /**
   * User DTO builder.
   */
  static UserDtoBuilder = class {
    constructor() {
      this.id = '';
      this.firstName = '';
      this.email = '';
      this.role = '';
      this.lastName = '';
      this.middleName = '';
    }

    setId(id) {
      this.id = id;
      return this;
    }

    setFirstName(firstName) {
      this.firstName = firstName;
      return this;
    }

    setEmail(email) {
      this.email = email;
      return this;
    }

    setRole(role) {
      this.role = role;
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

    build() {
      return new UserDto(
        this.firstName,
        this.email,
        this.id,
        this.role,
        this.lastName,
        this.middleName
      );
    }
  };
}
