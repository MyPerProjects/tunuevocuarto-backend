import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PropertyModule } from './infrastructure/persistence/property.module';
import { AuthModule } from './infrastructure/auth/auth.module'; // Importante
import { UsersModule } from './infrastructure/persistence/users.module';
import { WhatsappModule } from './infrastructure/modules/whatsapp.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '77500339',
      database: 'tunuevocuarto_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PropertyModule,
    AuthModule,
    UsersModule,
    WhatsappModule,
  ],
})
export class AppModule {}
