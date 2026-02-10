import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/user.entity';
import { Team } from '../teams/entities/team.entity';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    private tasksGateway: TasksGateway,
  ) { }

  async create(createTaskDto: CreateTaskDto, user: User) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      responsible: user,
    });

    if (createTaskDto.responsibleId) {
      const responsible = await this.usersRepository.findOne({ where: { id: createTaskDto.responsibleId } });
      if (responsible) {
        task.responsible = responsible;
      }
    }

    if (createTaskDto.teamId) {
      const team = await this.teamsRepository.findOne({ where: { id: createTaskDto.teamId } });
      if (team) {
        task.team = team;
      }
    }

    const savedTask = await this.tasksRepository.save(task);
    
    const fullTask = await this.findOne(savedTask.id);
    
    if (fullTask.team) {
      this.tasksGateway.serverEmitToTeam(fullTask.team.id, 'taskCreated', fullTask);
    }

    return savedTask;
  }

  findAll() {
    return this.tasksRepository.find({ relations: ['responsible', 'team'] });
  }

  async findOne(id: number) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['responsible', 'comments', 'comments.author', 'team']
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);

    if (updateTaskDto.responsibleId) {
      const responsible = await this.usersRepository.findOne({ where: { id: updateTaskDto.responsibleId } });
      if (responsible) {
        task.responsible = responsible;
      }
      delete updateTaskDto.responsibleId;
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);

    if (updatedTask.team) {
      this.tasksGateway.serverEmitToTeam(updatedTask.team.id, 'taskUpdated', updatedTask);
    }

    return updatedTask;
  }

  async remove(id: number) {
    const task = await this.findOne(id);
    const teamId = task.team?.id;
    const removed = await this.tasksRepository.remove(task);
    
    if (teamId) {
      this.tasksGateway.serverEmitToTeam(teamId, 'taskDeleted', { id });
    }
    
    return removed;
  }

  async addComment(taskId: number, content: string, user: User) {
    const task = await this.findOne(taskId);
    const comment = this.commentsRepository.create({
      content,
      task,
      author: user,
    });
    const savedComment = await this.commentsRepository.save(comment);
    
    if (task.team) {
        this.tasksGateway.serverEmitToTeam(task.team.id, 'commentAdded', { taskId, comment: savedComment });
    }

    return savedComment;
  }
}
