import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { TeamMember } from './team-member.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.adminTeams)
  admin: User;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];

  @OneToMany(() => Task, (task) => task.team)
  tasks: Task[];
}
