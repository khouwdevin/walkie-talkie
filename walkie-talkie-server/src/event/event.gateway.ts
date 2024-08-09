import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origins: '*' } })
export class EventGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  onMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    this.server.emit('chat', { user: client.id, message: data });
  }
}
