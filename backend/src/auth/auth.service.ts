import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { email, isActive: true }
    });
    
    if (user && await user.validatePassword(password)) {
      // Update last login
      await this.userRepository.update(user.id, { 
        lastLoginAt: new Date() 
      });
      
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      name: user.name 
    };

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
      preferences: {
        language: 'en',
        currency: 'USD',
        theme: 'system'
      }
    });

    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser;

    const payload = { 
      email: savedUser.email, 
      sub: savedUser.id,
      name: savedUser.name 
    };

    return {
      user: userWithoutPassword,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });
  }
} 