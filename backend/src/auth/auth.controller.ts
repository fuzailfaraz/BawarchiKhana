import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.requestOtp(phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otp);
  }
}
