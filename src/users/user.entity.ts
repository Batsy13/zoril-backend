import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Task } from '../tasks/entities/task.entity';
import { Comment } from '../tasks/entities/comment.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMember } from '../teams/entities/team-member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @OneToMany(() => Task, (task) => task.responsible)
  assignedTasks: Task[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Team, (team) => team.admin)
  adminTeams: Team[];

  @OneToMany(() => TeamMember, (membership) => membership.user)
  teamMemberships: TeamMember[];
}
