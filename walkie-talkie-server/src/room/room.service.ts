import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dynamicImport } from 'tsimportlib';

@Injectable()
export class RoomService {
  private livekit: typeof import('livekit-server-sdk');

  constructor(private readonly configService: ConfigService) {
    dynamicImport('livekit-server-sdk', module)
      .then((livekit) => {
        this.livekit = livekit;
      })
      .catch(() => {});
  }

  async getToken(username: string) {
    try {
      const roomName = 'walkie-talkie';
      const participantName = username;

      const at = new this.livekit.AccessToken(
        this.configService.get<string>('LIVEKIT-API-KEY'),
        this.configService.get<string>('LIVEKIT-API-SECRET'),
        {
          identity: participantName,
        },
      );
      at.addGrant({ roomJoin: true, room: roomName });

      const token = await at.toJwt();

      return { token };
    } catch (e) {
      return { error: e };
    }
  }
}
