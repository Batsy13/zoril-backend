import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/user.entity';

export enum TeamMemberStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
}

@Entity()
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => User, (user) => user.teamMemberships, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: TeamMemberStatus,
    default: TeamMemberStatus.PENDING,
  })
  status: TeamMemberStatus;
}
