import { createUserDto } from '../dto/UserDto.js';
import { createUserEntity } from '../entities/UserEntity.js';

/**
 * Функции для маппинга объектов
 */

/**
 * Преобразует DTO пользователя в сущность
 * @param {Object} userDto - DTO пользователя
 * @returns {Object} - Сущность пользователя
 */
export function toUserEntity(userDto) {
  return createUserEntity({
    _id: userDto.id || '',
    firstName: userDto.firstName,
    email: userDto.email,
    password: '',
    lastName: userDto.lastName || '',
    middleName: userDto.middleName || '',
    role: userDto.role || '',
  });
}

/**
 * Преобразует сущность пользователя в DTO
 * @param {Object} entity - Сущность пользователя
 * @returns {Object} - DTO пользователя
 */
export function toUserDto(entity) {
  return createUserDto({
    id: entity._id,
    firstName: entity.firstName,
    email: entity.email,
    role: entity.role,
    lastName: entity.lastName || '',
    middleName: entity.middleName || '',
  });
}
