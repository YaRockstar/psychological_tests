import { UserDto } from '../dto/UserDto.js';
import { UserEntity } from '../entities/UserEntity.js';

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
  static toUserEntity(userDto) {
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
  static toUserDto(entity) {
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
