import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsIn } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdminService } from './admin.service';

class PublishDto {
  @IsIn(['course', 'mock'])
  type!: 'course' | 'mock';

  @IsBoolean()
  isPublished!: boolean;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('import/course')
  @ApiOperation({ summary: 'Kurs JSON faylini import qilish (upsert by slug)' })
  importCourse(@Body() body: unknown) {
    return this.adminService.importCourse(body);
  }

  @Post('import/mock')
  @ApiOperation({ summary: 'Mock imtihon JSONini import qilish' })
  @ApiQuery({ name: 'force', required: false })
  importMock(@Body() body: unknown, @Query('force') force?: string) {
    return this.adminService.importMock(body, force === 'true');
  }

  @Post('import/vocab')
  @ApiOperation({ summary: 'Lug‘at JSONini import qilish' })
  importVocab(@Body() body: unknown) {
    return this.adminService.importVocab(body);
  }

  @Patch('publish/:slug')
  @ApiOperation({ summary: 'Kurs/mockni nashr qilish yoki yashirish' })
  publish(@Param('slug') slug: string, @Body() dto: PublishDto) {
    return this.adminService.setPublished(dto.type, slug, dto.isPublished);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Platforma statistikasi' })
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Foydalanuvchilar ro‘yxati' })
  users(@Query() pagination: PaginationDto) {
    return this.adminService.listUsers(pagination.page, pagination.limit);
  }

  @Post('evaluations/:id/retry')
  @ApiOperation({ summary: 'Muvaffaqiyatsiz AI baholashni qayta navbatga qo‘yish' })
  retryEvaluation(@Param('id') id: string) {
    return this.adminService.retryEvaluation(id);
  }
}
