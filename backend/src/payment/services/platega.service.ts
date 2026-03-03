import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaymentService } from '../payment.service';
import { Decimal } from '@prisma/client/runtime/library';
import { PlategaPaymentMethod } from '@/types/types';

interface IPlategaCreateTransactionData {
  paymentMethod: PlategaPaymentMethod;
  amount: number;
  description: string;
  payload?: string;
  userId: string;
}

@Injectable()
export class PlategaService {
  private readonly baseUrl = 'https://app.platega.io/';

  constructor(private readonly configService: ConfigService, private readonly paymentService: PaymentService) {
  }

  private instance = axios.create({
    baseURL: this.baseUrl,
    headers: {
      'X-MerchantId': this.configService.get<string>('PLATEGA_MERCHANT_ID'),
      'X-Secret': this.configService.get<string>('PLATEGA_SECRET'),
      'Content-Type': 'application/json',
    },
  });

  async createTransaction(data: IPlategaCreateTransactionData) {
    try {

      const { paymentMethod, amount, description, payload, userId } = data;

      const response = await this.instance.post(
        '/transaction/process',
        {
          paymentMethod: paymentMethod,
          paymentDetails: {
            amount: amount,
            currency: 'RUB',
          },
          description: description,
          return: 'https://t.me/clashstarsbot',
          failedUrl: 'https://t.me/clashstarsbot',
          payload: payload,
        },
      );

      const responseData = response.data;
      console.log(responseData, 'responseData');

      
      // await this.paymentService.createDepositPlatega(userId, responseData.transactionId, new Decimal(amount), paymentMethod);



      return responseData;
    } catch (error) {
      console.error('Platega createTransaction error:', error);
      throw error;
    }
  }
}

