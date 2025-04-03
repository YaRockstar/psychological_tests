import { Schema } from 'mongoose';

/**
 * User entity.
 */
export class UserEntity {
  private constructor(
    public readonly _id: string,
    public readonly firstName: string,
    public readonly email: string,
    public readonly password?: string,
    public readonly role?: Schema.Types.ObjectId,
    public readonly lastName?: string,
    public readonly middleName?: string,
    public readonly description?: string,
    public readonly birthDate?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  public static builder() {
    return new UserEntity.UserBuilder();
  }

  /**
   * User builder.
   */
  private static UserBuilder = class {
    private _id: string = '';
    private firstName: string = '';
    private email: string = '';
    private password?: string;
    private role?: Schema.Types.ObjectId;
    private lastName?: string;
    private middleName?: string;
    private description?: string;
    private birthDate?: Date;
    private createdAt?: Date;
    private updatedAt?: Date;

    public setId(id: string): this {
      this._id = id;
      return this;
    }

    public setFirstName(firstName: string): this {
      this.firstName = firstName;
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

    public setEmail(email: string): this {
      this.email = email;
      return this;
    }

    public setPassword(password: string): this {
      this.password = password;
      return this;
    }

    public setRole(role: Schema.Types.ObjectId): this {
      this.role = role;
      return this;
    }

    public setDescription(description: string): this {
      this.description = description;
      return this;
    }

    public setBirthdate(birthDate: Date): this {
      this.birthDate = birthDate;
      return this;
    }

    public setCreatedAt(createdAt: Date): this {
      this.createdAt = createdAt;
      return this;
    }

    public setUpdatedAt(updatedAt: Date): this {
      this.updatedAt = updatedAt;
      return this;
    }

    public build(): UserEntity {
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
