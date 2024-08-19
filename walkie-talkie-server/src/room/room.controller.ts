import { Controller, Get, Param } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Controller()
export class RoomController {
  constructor() {}

  @Get('room/:username')
  async getToken(@Param('username') username: string) {
    const roomName = 'walkie-talkie';
    const participantName = username;

    const at = new AccessToken(
      'API2F2dpVb53mMx',
      '0QAgOa505kfQLhnBFZfM5U3Q2CL33c3ROFONFyyFKwU',
      {
        identity: participantName,
      },
    );
    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();

    return { token };
  }
}
