import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PropertyModule } from './infrastructure/persistence/property.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { UsersModule } from './infrastructure/persistence/users.module';
import { WhatsappModule } from './infrastructure/modules/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      ssl:
        process.env.DB_HOST && !process.env.DB_HOST.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
    }),
    PropertyModule,
    AuthModule,
    UsersModule,
    WhatsappModule,
  ],
})
export class AppModule {}
