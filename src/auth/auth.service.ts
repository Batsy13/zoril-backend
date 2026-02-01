import { Injectable } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) { }

  async validateUser({ username, password }: AuthPayloadDto) {
    const findUser = await this.usersService.findOneByEmail(username);
    if (!findUser) return null;

    const isMatch = await bcrypt.compare(password, findUser.password)
    if (isMatch) {
      const { password, ...user } = findUser;
      return this.jwtService.sign({ ...user });
    }
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

}
