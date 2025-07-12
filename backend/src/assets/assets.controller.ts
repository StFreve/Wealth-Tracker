import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  create(@Body() createAssetDto: any, @Request() req) {
    return this.assetsService.create({
      ...createAssetDto,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets for current user' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  findAll(@Request() req) {
    return this.assetsService.findAll(req.user.id);
  }

  @Get('portfolio-summary')
  @ApiOperation({ summary: 'Get portfolio summary' })
  @ApiResponse({ status: 200, description: 'Portfolio summary retrieved successfully' })
  getPortfolioSummary(@Request() req) {
    return this.assetsService.getPortfolioSummary(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.assetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  update(@Param('id') id: string, @Body() updateAssetDto: any, @Request() req) {
    return this.assetsService.update(id, req.user.id, updateAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.assetsService.remove(id, req.user.id);
  }

  @Post(':id/transactions')
  @ApiOperation({ summary: 'Add transaction to asset' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  createTransaction(@Param('id') assetId: string, @Body() createTransactionDto: any, @Request() req) {
    return this.assetsService.createTransaction({
      ...createTransactionDto,
      assetId,
      userId: req.user.id,
    });
  }
} 