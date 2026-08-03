import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Profilni yangilash (maqsad daraja, imtihon sanasi, til va h.k.)' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}
