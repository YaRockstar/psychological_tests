import { UserRepository } from '../repositories/interfaces/UserRepository.ts';
import { UserEntity } from '../entities/UserEntity.ts';
import { UserDto } from '../dto/UserDto.ts';
import { Mapper } from '../utils/Mapper.ts';

/**
 * User service.
 */
export class UserService {
  private static instance: UserService;
  private userRepository: UserRepository;

  private constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  public static getInstance(userRepository: UserRepository): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(userRepository);
    }
    return UserService.instance;
  }

  public async createUser(userDto: UserDto): Promise<UserDto> {
    const userEntity = Mapper.toUserEntity(userDto);
    const createdUser = await this.userRepository.create(userEntity);
    return Mapper.toUserDto(createdUser);
  }

  public async getUserByEmail(email: string): Promise<UserDto | null> {
    const userEntity = await this.userRepository.findByEmail(email);
    return userEntity ? Mapper.toUserDto(userEntity) : null;
  }

  public async getUserById(id: string): Promise<UserDto | null> {
    const userEntity = await this.userRepository.findById(id);
    return userEntity ? Mapper.toUserDto(userEntity) : null;
  }

  public async updateUser(id: string, data: Partial<UserDto>): Promise<UserDto | null> {
    const userEntity = await this.userRepository.update(
      id,
      Mapper.toUserEntity(data as UserDto)
    );
    return userEntity ? Mapper.toUserDto(userEntity) : null;
  }

  public async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
