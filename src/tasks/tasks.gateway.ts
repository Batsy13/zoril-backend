import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTeam')
  handleJoinTeam(@MessageBody() teamId: number, @ConnectedSocket() client: Socket) {
    client.join(`team_${teamId}`);
    return { event: 'joinedTeam', data: { teamId } };
  }

  @SubscribeMessage('leaveTeam')
  handleLeaveTeam(@MessageBody() teamId: number, @ConnectedSocket() client: Socket) {
    client.leave(`team_${teamId}`);
    return { event: 'leftTeam', data: { teamId } };
  }

  serverEmitToTeam(teamId: number, event: string, data: any) {
    this.server.to(`team_${teamId}`).emit(event, data);
  }
}
