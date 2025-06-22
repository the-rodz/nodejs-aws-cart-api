import { CartItemEntity } from 'src/entities/cart-item.entity';

export function calculateCartTotal(items: CartItemEntity[]): number {
  return items.length;
}
