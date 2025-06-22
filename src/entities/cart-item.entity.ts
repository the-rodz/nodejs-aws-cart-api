import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { CartEntity } from "./cart.entity";

@Entity('cart_items')
export class CartItemEntity {
  @PrimaryColumn({ name: 'cart_id' })
  cartId: number;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'integer', default: 1 })
  count: number;

  @ManyToOne(() => CartEntity, cart => cart.items, { onDelete: 'CASCADE' })
  cart: CartEntity;
}
