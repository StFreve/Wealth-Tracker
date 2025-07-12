import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

export enum WidgetType {
  PORTFOLIO_SUMMARY = 'portfolio_summary',
  ASSET_ALLOCATION = 'asset_allocation',
  PERFORMANCE_CHART = 'performance_chart',
  TOP_ASSETS = 'top_assets'
}

export enum WidgetVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

@Entity('widgets')
export class Widget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  publicId: string; // Used in shareable URLs

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: WidgetType
  })
  type: WidgetType;

  @Column({
    type: 'enum',
    enum: WidgetVisibility,
    default: WidgetVisibility.PUBLIC
  })
  visibility: WidgetVisibility;

  @Column({ type: 'jsonb', default: {} })
  configuration: {
    timeRange?: string;
    currency?: string;
    showValues?: boolean;
    showPercentages?: boolean;
    chartType?: string;
    assetTypes?: string[];
    theme?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  cachedData: any; // Cached widget data for performance

  @Column({ nullable: true })
  lastCachedAt: Date;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.widgets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @BeforeInsert()
  generatePublicId() {
    this.publicId = uuidv4();
  }

  get shareableUrl(): string {
    return `/widget/${this.publicId}`;
  }

  get embedCode(): string {
    return `<iframe src="${process.env.FRONTEND_URL}/widget/${this.publicId}" width="100%" height="400" frameborder="0"></iframe>`;
  }
} 