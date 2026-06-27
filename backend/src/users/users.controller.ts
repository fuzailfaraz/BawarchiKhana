import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.usersService.getHistory(req.user.id);
  }

  @Patch('pantry')
  async updatePantry(@Request() req: any, @Body('pantry') pantry: any[]) {
    return this.usersService.updatePantry(req.user.id, pantry);
  }

  @Get('impact')
  async getImpact(@Request() req: any) {
    return this.usersService.getImpact(req.user.id);
  }
}
