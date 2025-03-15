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
    return UserEntity.builder()
      .setFirstName(userDto.firstName)
      .setEmail(userDto.email)
      .setPassword('')
      .setId(userDto.id ?? '')
      .setLastName(userDto?.lastName ?? '')
      .setMiddleName(userDto?.middleName ?? '')
      .setRole(userDto.role ?? '')
      .build();
  }

  /**
   * Map a user entity to a dto.
   *
   * @param entity user entity
   * @returns the mapped user dto
   */
  public static toUserDto(entity: UserEntity): UserDto {
    return UserDto.builder()
      .setId(entity._id)
      .setFirstName(entity.firstName)
      .setEmail(entity.email)
      .setRole(entity.role)
      .setLastName(entity.lastName ?? '')
      .setMiddleName(entity.middleName ?? '')
      .build();
  }
}
