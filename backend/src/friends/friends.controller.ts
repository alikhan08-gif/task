import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  sendRequest(@CurrentUser() user: RequestUser, @Body() dto: SendFriendRequestDto) {
    return this.friendsService.sendRequest(user.userId, dto.email);
  }

  @Get('requests/incoming')
  listIncoming(@CurrentUser() user: RequestUser) {
    return this.friendsService.listIncoming(user.userId);
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.friendsService.accept(user.userId, id);
  }

  @Delete('requests/:id')
  decline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.friendsService.decline(user.userId, id);
  }

  @Get()
  listFriends(@CurrentUser() user: RequestUser) {
    return this.friendsService.listFriends(user.userId);
  }
}
