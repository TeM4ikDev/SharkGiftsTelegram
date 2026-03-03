import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  const PORT = 1818;



  app.enableCors({
    origin: '*',
  })
  app.use(express.json());
  app.setGlobalPrefix('api');

  
  app.use(
    '/public',
    express.static(join(__dirname, '..', 'public')),
  );

  
  app.use(
    '/assets',
    express.static(join(__dirname, '../../client/dist/assets')),
  );


  app.use(
    express.static(join(__dirname, '../../client/dist')),
  );

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    const hasFileExtension = /\.\w+$/.test(req.path);
    if (hasFileExtension) {
      return next();
    }


    res.sendFile(join(__dirname, '../../client/dist/index.html'));

  });

  process.on('unhandledRejection', (reason) => {
    console.error('❗ Unhandled rejection:', reason);
  });

  await app.listen(PORT, () => {
    console.log(`Nest application is ready on http://localhost:${PORT}`);
  });
}
bootstrap();
