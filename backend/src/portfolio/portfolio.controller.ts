import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  findAll(@Request() req) {
    return this.portfolioService.findAll(req.user.id);
  }

  @Post()
  create(@Body() createPortfolioDto: any, @Request() req) {
    return this.portfolioService.create({
      ...createPortfolioDto,
      userId: req.user.id,
    });
  }
} 