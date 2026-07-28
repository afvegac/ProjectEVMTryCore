import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './activity.entity';
import { ProjectActivitiesController } from './project-activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activity]), ProjectsModule],
  controllers: [ProjectActivitiesController, ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
