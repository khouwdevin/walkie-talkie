import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IMessage } from './event.interface';

@WebSocketGateway({ cors: { origins: '*' } })
export class EventGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  onJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
  }

  @SubscribeMessage('message')
  onMessage(@MessageBody() body: IMessage, @ConnectedSocket() client: Socket) {
    this.server
      .to(body.room)
      .emit('chat', { user: client.id, message: body.data });
  }
}
