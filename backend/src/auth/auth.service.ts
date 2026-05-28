import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(phone: string) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    // Generate a 6-digit OTP (simulated for MVP)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Save to DB
    await this.prisma.otpVerification.create({
      data: {
        phone,
        otp,
        expiresAt,
      },
    });

    // Simulate sending OTP
    this.logger.log(`[SIMULATED SMS] OTP for ${phone} is: ${otp}`);

    return { message: 'OTP sent successfully', phone };
  }

  async verifyOtp(phone: string, otp: string) {
    if (!phone || !otp) {
      throw new BadRequestException('Phone number and OTP are required');
    }

    // Find latest OTP for phone
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No OTP found for this phone number');
    }

    if (otpRecord.verified) {
      throw new UnauthorizedException('OTP already used');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    if (otpRecord.attempts >= 3) {
      throw new UnauthorizedException('Maximum attempts reached. Please request a new OTP');
    }

    if (otpRecord.otp !== otp) {
      // Increment attempt count
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP is valid, mark as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone },
      });
    }

    // Generate JWT
    const payload = { sub: user.id, phone: user.phone, isPremium: user.isPremium };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isPremium: user.isPremium,
      },
    };
  }
}
