export class UserDto {
  constructor(
    public id: string,
    public firstName: string,
    public email: string,
    public role: string,
    public lastName?: string,
    public middleName?: string
  ) {}
}

export class UserDtoBuilder {
  private id: string = '';
  private firstName: string = '';
  private email: string = '';
  private role: string = '';
  private lastName?: string = '';
  private middleName?: string = '';

  public setId(id: string): this {
    this.id = id;
    return this;
  }

  public setFirstName(firstName: string): this {
    this.firstName = firstName;
    return this;
  }

  public setEmail(email: string): this {
    this.email = email;
    return this;
  }

  public setRole(role: string): this {
    this.role = role;
    return this;
  }

  public setLastName(lastName: string): this {
    this.lastName = lastName;
    return this;
  }

  public setMiddleName(middleName: string): this {
    this.middleName = middleName;
    return this;
  }

  public build(): UserDto {
    return new UserDto(
      this.id,
      this.firstName,
      this.email,
      this.role,
      this.lastName,
      this.middleName
    );
  }
}
