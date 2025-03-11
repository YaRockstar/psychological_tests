export class UserDto {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly email: string,
    public readonly role: string,
    public readonly lastName?: string,
    public readonly middleName?: string
  ) {}
}

export class UserDtoBuilder {
  private id: string = '';
  private firstName: string = '';
  private lastName?: string = '';
  private middleName?: string = '';
  private email: string = '';
  private role: string = '';

  public setId(id: string): this {
    this.id = id;
    return this;
  }

  public setFirstName(firstName: string): this {
    this.firstName = firstName;
    return this;
  }
}
