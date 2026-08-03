import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Subject } from '@prisma/client';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Nashr etilgan kurslar ro‘yxati' })
  @ApiQuery({ name: 'subject', enum: Subject, required: false })
  list(@Query('subject') subject?: Subject) {
    return this.coursesService.listCourses(subject);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Kurs tafsilotlari (modullar + darslar, progress bilan)' })
  get(@Param('slug') slug: string, @Req() req: Request) {
    const user = (req as Request & { user?: JwtUser }).user;
    return this.coursesService.getCourse(slug, user?.sub);
  }

  @Public()
  @Get('lessons/:id')
  @ApiOperation({ summary: 'Dars kontenti (bloklar + mashqlar, javoblarsiz)' })
  getLesson(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user?: JwtUser }).user;
    return this.coursesService.getLesson(id, user?.sub);
  }
}
