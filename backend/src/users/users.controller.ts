import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateTimezoneDto } from './dto/update-timezone.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@CurrentUser() user: RequestUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('timezone')
  updateTimezone(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateTimezoneDto,
  ) {
    return this.usersService.updateTimezone(user.userId, dto.timezone);
  }
}
