import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class RoomController {
  constructor() {}

  @Get('room/:username')
  async getToken(@Param('username') username: string) {
    try {
      const { AccessToken } = await import('livekit-server-sdk');

      const roomName = 'walkie-talkie';
      const participantName = username;

      const at = new AccessToken('', '', {
        identity: participantName,
      });
      at.addGrant({ roomJoin: true, room: roomName });

      const token = await at.toJwt();

      return { token };
    } catch (e) {
      return { error: e };
    }
  }
}
