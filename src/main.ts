import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // =========================================================================
  process.on('uncaughtException', (error: any) => {
    logger.error(
      '⚠️ [CRITICAL] Excepción asíncrona no capturada mitigada con éxito:',
    );
    console.error(error);
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.warn(
      '⚠️ [WARNING] Promesa no capturada (Rejection) prevenida de forma segura:',
    );
    console.error(reason);
  });

  const app = await NestFactory.create(AppModule);

  // 1. Activación de validaciones globales para blindar los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Configuración de Swagger con Seguridad JWT (Bearer Auth)
  const config = new DocumentBuilder()
    .setTitle('TuNuevoCuarto API')
    .setDescription(
      'Sistema de gestión de alquileres con autenticación Google y automatización de cobros',
    )
    .setVersion('1.0')
    .addTag('properties')
    .addTag('tenants')
    .addTag('leases')
    .addTag('auth')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu access_token obtenido del login con Google',
        in: 'header',
      },
      'access-token', // Referencia que se usa en los decoradores @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 3. Habilitar CORS para permitir la conexión futura con el frontend en Angular
  app.enableCors();

  // 4. Iniciar el servidor
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Obtenemos la URL real para el log
  const url = await app.getUrl();
  logger.log(`Application is running on: ${url}/api`);
}

bootstrap();
