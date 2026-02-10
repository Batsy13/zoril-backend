import { Controller, Post, Body, Param, Delete, UseGuards, Get, ParseIntPipe, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(createTeamDto, req.user);
  }

  @Post(':id/invite')
  invite(@Param('id', ParseIntPipe) id: number, @Body() inviteUserDto: InviteUserDto, @Request() req) {
    return this.teamsService.invite(id, inviteUserDto.email, req.user.id);
  }

  @Post('invites/:id/accept')
  acceptInvite(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.acceptInvite(id, req.user.id);
  }

  @Delete(':teamId/members/:memberId')
  removeMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Request() req,
  ) {
    return this.teamsService.removeMember(teamId, memberId, req.user.id);
  }

  @Get('my')
  getMyTeams(@Request() req) {
    return this.teamsService.getMyTeams(req.user.id);
  }

  @Get(':id/tasks')
  getTeamTasks(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teamsService.getTeamTasks(id, req.user.id);
  }
}
