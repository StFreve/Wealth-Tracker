import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('portfolios')
@Index(['userId', 'snapshotDate'])
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalGainLoss: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  totalGainLossPercentage: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  dayChange: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  dayChangePercentage: number;

  @Column({ type: 'jsonb' })
  assetAllocation: {
    type: string;
    value: number;
    percentage: number;
  }[];

  @Column({ type: 'jsonb' })
  performanceMetrics: {
    sharpeRatio?: number;
    volatility?: number;
    maxDrawdown?: number;
    beta?: number;
    alpha?: number;
  };

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column()
  snapshotDate: Date;

  @Column({ default: false })
  isDaily: boolean; // True for daily snapshots, false for manual snapshots

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.portfolios)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
} 