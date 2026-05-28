import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, method: string, amount: number) {
    if (!['jazzcash', 'easypesa'].includes(method.toLowerCase())) {
      throw new BadRequestException('Invalid payment method');
    }

    const transactionId = `TXN-${randomUUID().substring(0, 8).toUpperCase()}`;

    // Create a pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        paymentMethod: method,
        transactionId,
        status: 'pending',
      },
    });

    return {
      success: true,
      transactionId,
      message: `Mock checkout initiated for ${method}`,
      // In a real app, this would return the URL to redirect the user to
      paymentUrl: `/api/mock-payment-gateway?txn=${transactionId}`,
    };
  }

  async handleWebhook(body: any) {
    const { transactionId, status } = body;

    if (!transactionId || !status) {
      throw new BadRequestException('Missing transactionId or status');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    // If successful, upgrade the user to premium
    if (status === 'completed') {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1); // 1 month from now

      await this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          isPremium: true,
          subscriptionExpiresAt: expirationDate,
        },
      });
    }

    return { success: true, message: 'Webhook processed' };
  }
}
