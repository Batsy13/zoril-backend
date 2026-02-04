import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

    return this.tasksRepository.save(task);
  }

  findAll() {
    return this.tasksRepository.find({ relations: ['responsible'] });
  }

  async findOne(id: number) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['responsible', 'comments', 'comments.author']
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
    return this.tasksRepository.save(task);
  }

  async remove(id: number) {
    const task = await this.findOne(id);
    return this.tasksRepository.remove(task);
  }

  async addComment(taskId: number, content: string, user: User) {
    const task = await this.findOne(taskId);
    const comment = this.commentsRepository.create({
      content,
      task,
      author: user,
    });
    return this.commentsRepository.save(comment);
  }
}
