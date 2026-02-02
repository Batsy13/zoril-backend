import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller("/auth")
export class AuthController {

  constructor(private authService: AuthService) { }

  @Post("/login")
  @UseGuards(LocalGuard)
  login(@Req() req: Request) {
    return this.authService.login(req.user);
  }

  @Get("/whoami")
  @UseGuards(JwtAuthGuard)
  whoami(@Req() req: Request) {
    return req.user
  }

  @Post("/register")
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

}
