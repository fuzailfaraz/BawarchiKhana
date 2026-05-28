import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(
    @Request() req: any,
    @Body('method') method: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentsService.checkout(req.user.id, method, amount);
  }

  // Webhook is typically unauthenticated (or secured by a secret signature)
  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
