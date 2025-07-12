import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Widget, WidgetVisibility } from './entities/widget.entity';

@Injectable()
export class WidgetsService {
  constructor(
    @InjectRepository(Widget)
    private widgetRepository: Repository<Widget>,
  ) {}

  async findAll(userId: string): Promise<Widget[]> {
    return this.widgetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(widgetData: Partial<Widget>): Promise<Widget> {
    const widget = this.widgetRepository.create(widgetData);
    return this.widgetRepository.save(widget);
  }

  async findByPublicId(publicId: string): Promise<Widget | null> {
    return this.widgetRepository.findOne({
      where: { 
        publicId, 
        visibility: WidgetVisibility.PUBLIC 
      },
    });
  }
} 