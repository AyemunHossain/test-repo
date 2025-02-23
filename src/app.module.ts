import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './pages/user/user.module';
import { UtilsModule } from './shared/utils/utils.module';
import { AdminModule } from './pages/admin/admin.module';
import { JobSchedulerModule } from './shared/job-scheduler/job-scheduler.module';
import { NewsModule } from './pages/news/news.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRoot(configuration().mongoCluster),
    AdminModule,
    UserModule,
    UtilsModule,
    JobSchedulerModule,
    NewsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
