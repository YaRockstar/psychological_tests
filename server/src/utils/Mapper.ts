import { UserDto } from '../dto/UserDto.ts';
import { UserEntity } from '../entities/UserEntity.ts';

/**
 * Mapper class.
 */
export class Mapper {
  /**
   * Map a user to an entity.
   *
   * @param userDto user DTO
   * @returns the mapped user entity
   */
  public static toUserEntity(userDto: UserDto): UserEntity {
    return (
      UserEntity.builder()
        .setEmail(userDto.email)
        .setFirstName(userDto.firstName)
        // .setLastName(userDto?.lastName)
        // .setPassword(userDto.password)
        .setRole(userDto.role)
        .build()
    );
  }

  // /**
  //  * Map a user to a dto.
  //  *
  //  * @param data user data
  //  * @returns the mapped user dto
  //  */
  // public static toUserDto(UserEntity: UserEntity): UserDto {
  //   // return new UserEntity(dto.email, dto.fullName, dto.password);
  // }
}
