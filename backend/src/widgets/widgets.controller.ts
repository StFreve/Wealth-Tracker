import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WidgetsService } from './widgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Widgets')
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Request() req) {
    return this.widgetsService.findAll(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() createWidgetDto: any, @Request() req) {
    return this.widgetsService.create({
      ...createWidgetDto,
      userId: req.user.id,
    });
  }

  @Get('public/:publicId')
  findByPublicId(@Param('publicId') publicId: string) {
    return this.widgetsService.findByPublicId(publicId);
  }
} 