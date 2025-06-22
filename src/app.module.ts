import { Module } from '@nestjs/common';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseCredentials } from './config/database.config';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';

@Module({
  imports: [
    AuthModule,
    CartModule,
    OrderModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const credentials = await getDatabaseCredentials();

        return {
          type: 'postgres',
          host: credentials.host,
          port: credentials.port,
          username: credentials.username,
          password: credentials.password,
          database: credentials.database,
          entities: [ CartEntity, CartItemEntity ],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
          logging: true,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
