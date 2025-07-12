import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
  ) {}

  async findAll(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(portfolioData: Partial<Portfolio>): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create(portfolioData);
    return this.portfolioRepository.save(portfolio);
  }
} 