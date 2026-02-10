import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember, TeamMemberStatus } from './entities/team-member.entity';
import { User } from '../users/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createTeamDto: CreateTeamDto, user: User): Promise<Team> {
    const team = this.teamsRepository.create({
      ...createTeamDto,
      admin: user,
    });
    const savedTeam = await this.teamsRepository.save(team);

    const member = this.teamMembersRepository.create({
      team: savedTeam,
      user: user,
      status: TeamMemberStatus.ACCEPTED,
    });
    await this.teamMembersRepository.save(member);

    return savedTeam;
  }

  async invite(teamId: number, email: string, adminId: number): Promise<TeamMember> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['admin'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.admin.id !== adminId) {
      throw new ForbiddenException('Only admin can invite members');
    }

    const userToInvite = await this.usersRepository.findOne({ where: { email } });
    if (!userToInvite) {
      throw new NotFoundException('User to invite not found');
    }

    const existingMember = await this.teamMembersRepository.findOne({
      where: { team: { id: teamId }, user: { id: userToInvite.id } },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member or invited');
    }

    const member = this.teamMembersRepository.create({
      team,
      user: userToInvite,
      status: TeamMemberStatus.PENDING,
    });

    return this.teamMembersRepository.save(member);
  }

  async acceptInvite(memberId: number, userId: number): Promise<TeamMember> {
    const member = await this.teamMembersRepository.findOne({
      where: { id: memberId },
      relations: ['user', 'team'],
    });

    if (!member) {
      throw new NotFoundException('Invitation not found');
    }

    if (member.user.id !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    member.status = TeamMemberStatus.ACCEPTED;
    return this.teamMembersRepository.save(member);
  }

  async removeMember(teamId: number, memberId: number, adminId: number): Promise<void> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['admin'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.admin.id !== adminId) {
      throw new ForbiddenException('Only admin can remove members');
    }

    const member = await this.teamMembersRepository.findOne({
      where: { id: memberId, team: { id: teamId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    await this.teamMembersRepository.remove(member);
  }

  async getMyTeams(userId: number): Promise<Team[]> {
    const memberships = await this.teamMembersRepository.find({
      where: { user: { id: userId }, status: TeamMemberStatus.ACCEPTED },
      relations: ['team'],
    });
    return memberships.map(m => m.team);
  }

  async getTeamTasks(teamId: number, userId: number): Promise<any> {
    const member = await this.teamMembersRepository.findOne({
      where: { team: { id: teamId }, user: { id: userId }, status: TeamMemberStatus.ACCEPTED }
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this team');
    }

    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['tasks']
    });

    if (!team) return [];
    return team.tasks;
  }
}
