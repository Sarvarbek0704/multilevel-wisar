import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

// Telegram IDs are BigInt; make them JSON-serializable globally
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [process.env.WEB_URL ?? 'http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Uploaded media (listening audio, speaking recordings)
  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'), {
    prefix: '/uploads/',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('multilevel.wisar.uz API')
    .setDescription('Bepul CEFR (UzBMB multilevel) imtihoniga tayyorlash platformasi API hujjatlari')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`API running on http://localhost:${port} (docs: /docs)`);
}

bootstrap();
