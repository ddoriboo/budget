import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity('expenses')
@Index('idx_expenses_user_date', ['user', 'expenseDate'])
@Index('idx_expenses_category', ['user', 'category'])
@Index('idx_expenses_conversation', ['conversationId'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 200, nullable: true })
  place?: string;

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ default: false })
  isIncome: boolean;

  @Column({ length: 100, nullable: true })
  conversationId?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  confidenceScore: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.expenses, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;
}