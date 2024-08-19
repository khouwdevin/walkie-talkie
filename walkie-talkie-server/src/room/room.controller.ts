import { Controller, Get, Param } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Controller()
export class RoomController {
  constructor() {}

  @Get('room/:username')
  async getToken(@Param('username') username: string) {
    const roomName = 'walkie-talkie';
    const participantName = username;

    const at = new AccessToken('LIVEKIT-API-KEY', 'LIVEKIT-API-SECRET', {
      identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();

    return { token };
  }
}
