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

  async validateUser({ email, password }: AuthPayloadDto) {
    const findUser = await this.usersService.findOneByEmail(email);
    if (!findUser) return null;

    const isMatch = await bcrypt.compare(password, findUser.password)
    if (isMatch) {
      const { password, ...user } = findUser;
      return user;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

}
