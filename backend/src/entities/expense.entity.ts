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
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from './user.entity';
import { Category } from './category.entity';

@ObjectType()
@Entity('expenses')
@Index('IDX_expense_user_date', ['userId', 'expenseDate'])
@Index('IDX_expense_user_category', ['userId', 'categoryId'])
@Index('IDX_expense_date', ['expenseDate'])
@Index('IDX_expense_amount', ['amount'])
export class Expense {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column()
  userId: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Field(() => ID, { nullable: true })
  @Column({ nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  @Column({ length: 200, nullable: true })
  place?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Field()
  @Column({ type: 'date' })
  expenseDate: Date;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  paymentMethod?: string;

  @Field()
  @Column({ default: false })
  isIncome: boolean;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  conversationId?: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  confidenceScore: number;

  @Field(() => String)
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.expenses, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;
}