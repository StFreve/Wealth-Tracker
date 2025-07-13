import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

export enum AssetType {
  STOCK = 'stock',
  DEPOSIT = 'deposit',
  PRECIOUS_METAL = 'precious_metal',
  RECURRING_INCOME = 'recurring_income',
  CASH = 'cash',
  CRYPTO = 'crypto',
  REAL_ESTATE = 'real_estate',
  BONDS = 'bonds',
  OTHER = 'other'
}

export enum CompoundingType {
  SIMPLE = 'simple',
  COMPOUND = 'compound'
}

export enum InterestSchedule {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export enum FrequencyType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual'
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AssetType
  })
  type: AssetType;

  @Column()
  name: string;

  @Column({ nullable: true })
  symbol: string; // For stocks, crypto

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  currentPrice: number;

  @Column({ nullable: true })
  purchaseDate: Date;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // Stock-specific fields
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dividendYield: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dividendTax: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  capitalGainsTax: number;

  // Deposit-specific fields
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  principal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interestRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxRate: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: CompoundingType,
    nullable: true
  })
  compounding: CompoundingType;

  @Column({
    type: 'enum',
    enum: InterestSchedule,
    nullable: true
  })
  interestSchedule: InterestSchedule;

  // Precious metal-specific fields
  @Column({ nullable: true })
  metalType: string; // gold, silver, platinum, palladium

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  weight: number;

  @Column({ nullable: true })
  unit: string; // grams, ounces, kilograms

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  purity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  acquisitionCost: number;

  // Recurring income-specific fields
  @Column({ nullable: true })
  sourceName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountPerPeriod: number;

  @Column({
    type: 'enum',
    enum: FrequencyType,
    nullable: true
  })
  frequency: FrequencyType;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  inflationAdjustment: number;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.assets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Transaction, transaction => transaction.asset)
  transactions: Transaction[];

  // Calculated properties
  get currentValue(): number {
    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    if (this.type === AssetType.STOCK) {
      const currentPrice = safeNumber(this.currentPrice);
      const quantity = safeNumber(this.quantity);
      if (currentPrice > 0 && quantity > 0) {
        return currentPrice * quantity;
      }
    }
    
    if (this.type === AssetType.DEPOSIT) {
      const principal = safeNumber(this.principal);
      const interestRate = safeNumber(this.interestRate);
      if (principal > 0 && interestRate > 0) {
        // Calculate compound interest if applicable
        const now = new Date();
        const startDate = this.startDate || this.createdAt;
        const daysDiff = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const yearsFraction = daysDiff / 365;
        
        if (this.compounding === CompoundingType.COMPOUND) {
          return principal * Math.pow(1 + (interestRate / 100), yearsFraction);
        } else {
          return principal * (1 + (interestRate / 100) * yearsFraction);
        }
      }
      return principal; // Return principal if no interest calculation possible
    }
    
    if (this.type === AssetType.PRECIOUS_METAL) {
      const currentPrice = safeNumber(this.currentPrice);
      const weight = safeNumber(this.weight);
      if (currentPrice > 0 && weight > 0) {
        return currentPrice * weight;
      }
      // Fallback to acquisition cost if no current price
      return safeNumber(this.acquisitionCost);
    }
    
    if (this.type === AssetType.CASH) {
      return safeNumber(this.acquisitionCost);
    }
    
    if (this.type === AssetType.RECURRING_INCOME) {
      return 0; // Recurring income doesn't have a current value
    }
    
    // Fallback for other types
    const purchasePrice = safeNumber(this.purchasePrice);
    const quantity = safeNumber(this.quantity);
    return purchasePrice * quantity;
  }

  get totalGainLoss(): number {
    const currentVal = this.currentValue;
    
    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    let purchaseVal = 0;
    
    if (this.type === AssetType.STOCK) {
      const purchasePrice = safeNumber(this.purchasePrice);
      const quantity = safeNumber(this.quantity);
      purchaseVal = purchasePrice * quantity;
    } else if (this.type === AssetType.DEPOSIT) {
      purchaseVal = safeNumber(this.principal);
    } else if (this.type === AssetType.PRECIOUS_METAL) {
      purchaseVal = safeNumber(this.acquisitionCost);
    } else if (this.type === AssetType.CASH) {
      purchaseVal = safeNumber(this.acquisitionCost);
    } else if (this.type === AssetType.RECURRING_INCOME) {
      return 0; // Recurring income doesn't have gain/loss
    } else {
      // Fallback for other types
      const purchasePrice = safeNumber(this.purchasePrice);
      const quantity = safeNumber(this.quantity);
      purchaseVal = purchasePrice * quantity;
    }
    
    return currentVal - purchaseVal;
  }

  get gainLossPercentage(): number {
    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    let purchaseVal = 0;
    
    if (this.type === AssetType.STOCK) {
      const purchasePrice = safeNumber(this.purchasePrice);
      const quantity = safeNumber(this.quantity);
      purchaseVal = purchasePrice * quantity;
    } else if (this.type === AssetType.DEPOSIT) {
      purchaseVal = safeNumber(this.principal);
    } else if (this.type === AssetType.PRECIOUS_METAL) {
      purchaseVal = safeNumber(this.acquisitionCost);
    } else if (this.type === AssetType.CASH) {
      purchaseVal = safeNumber(this.acquisitionCost);
    } else if (this.type === AssetType.RECURRING_INCOME) {
      return 0; // Recurring income doesn't have gain/loss percentage
    } else {
      // Fallback for other types
      const purchasePrice = safeNumber(this.purchasePrice);
      const quantity = safeNumber(this.quantity);
      purchaseVal = purchasePrice * quantity;
    }
    
    if (purchaseVal === 0) return 0;
    return (this.totalGainLoss / purchaseVal) * 100;
  }
} 