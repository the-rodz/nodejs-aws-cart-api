import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { Order, OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { CartService } from './services';
import { PutCartPayload } from 'src/order/type';
import { CartItemEntity } from 'src/entities/cart-item.entity';
import { BasicAuthGuard } from 'src/auth';
import { RemoveCircularReferences } from 'src/decorators/transform-response-interceptor';

@Controller('api/profile/cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  @RemoveCircularReferences()
  async findUserCart(@Req() req: AppRequest): Promise<CartItemEntity[]> {
    try {
      const cart = await this.cartService.findOrCreateByUserId(
        getUserIdFromRequest(req),
      );

      return cart.items;
    } catch(error) {
      this.logger.error(`Something went wrong. ${error.message}`);
      throw new Error(`Error when retrieving user cart: ${error.message}`);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartItemEntity[]> {
    this.logger.log(`Incoming request to PUT /api/profile/cart.\nBody: ${JSON.stringify(body)}`);
    try {
      if (!body.product || !body.product?.id) {
        throw new Error('You must provide all required fields');
      }

      const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );

    return cart.items;
    } catch (error) {
      this.logger.error('Something went wrong during the request.');
      throw new Error(`Something failed while updating cart: ${error.message}`);
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearUserCart(@Req() req: AppRequest) {
    this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  getOrder(): Order[] {
    return this.orderService.getAll();
  }
}
