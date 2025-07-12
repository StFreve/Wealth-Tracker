import { Controller, Get, Param, UseGuards, Request, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Request() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
    const userId = req.user.id;
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedPreferences = {
      ...user.preferences,
      ...updatePreferencesDto,
    };

    return this.usersService.update(userId, { preferences: updatedPreferences });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
} 