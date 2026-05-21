import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UpdateProfileDto } from '../../infrastructure/dtos/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(email: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findByEmail(email);

    if (dto.yapeNumber) user.yapeNumber = dto.yapeNumber;
    if (dto.bcpAccount) user.bcpAccount = dto.bcpAccount;

    return await this.userRepository.save(user);
  }
}
