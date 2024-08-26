import { Controller, Get, Param } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('room/:username')
  async getToken(@Param('username') username: string) {
    return this.roomService.getToken(username);
  }
}
