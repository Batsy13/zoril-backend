import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { TasksGateway } from './tasks.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Comment, User, Team])],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
})
export class TasksModule { }
