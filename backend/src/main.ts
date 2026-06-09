import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for local dev + Vercel frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://bawarchi-khana-pi.vercel.app',
    ],
    credentials: true,
  });

  // ✅ Middleware for large JSON payloads (e.g., images)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // ✅ Cloud Run requires binding to 0.0.0.0 on injected PORT
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
}

bootstrap();
