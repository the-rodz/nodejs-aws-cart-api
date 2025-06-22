import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CartItemEntity } from "./cart-item.entity";

export enum CartStatus {
  OPEN = 'OPEN',
  ORDERED = 'ORDERED',
}

@Entity('carts')
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.OPEN })
  status: CartStatus;

  @OneToMany(() => CartItemEntity, cartItem => cartItem.cart, { cascade: true } )
  items: CartItemEntity[];
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
