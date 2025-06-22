import { Injectable, Logger } from '@nestjs/common';
import { PutCartPayload } from 'src/order/type';
import { InjectRepository } from '@nestjs/typeorm';
import { CartEntity } from 'src/entities/cart.entity';
import { Repository } from 'typeorm';
import { CartItemEntity } from 'src/entities/cart-item.entity';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ){};

  async findByUserId(userId: string): Promise<CartEntity> {
    return this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });
  }

  async createByUserId(userId: string): Promise<CartEntity> {
    const userCart = this.cartRepository.create({ userId, items: [] });
    return this.cartRepository.save(userCart);
  }

  async findOrCreateByUserId(userId: string): Promise<CartEntity> {
    try {
      const userCart = await this.findByUserId(userId);

      if (userCart) {
        return userCart;
      }

      return this.createByUserId(userId);
    } catch (error) {
      this.logger.error(`Something went wrong in cart service. ${error.message}`);
      throw new Error(`Something failed in cart service. ${error.message}`);
    }
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<CartEntity> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      const cartItem = await this.cartItemRepository.findOne({
        where: { cartId: userCart.id, productId: payload.product.id },
      });
      
      if (!cartItem) {
        const newCartItem: CartItemEntity = {
          cartId: userCart.id,
          productId: payload.product.id,
          count: payload.count,
          cart: userCart,
        }

        await this.cartItemRepository.save(newCartItem);
      } else {
        if (payload.count <= 0) {
          await this.cartItemRepository.remove(cartItem);
        } else {
          cartItem.count = payload.count;
          await this.cartItemRepository.save(cartItem);
        }
      }

      return this.findByUserId(userId);
    } 
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}
