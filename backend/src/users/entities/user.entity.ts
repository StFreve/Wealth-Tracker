import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Asset } from '../../assets/entities/asset.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Widget } from '../../widgets/entities/widget.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: {
    language?: string;
    currency?: string;
    theme?: string;
    timezone?: string;
    dateFormat?: string;
    numberFormat?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Asset, asset => asset.user)
  assets: Asset[];

  @OneToMany(() => Portfolio, portfolio => portfolio.user)
  portfolios: Portfolio[];

  @OneToMany(() => Widget, widget => widget.user)
  widgets: Widget[];

  // Password hashing
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 