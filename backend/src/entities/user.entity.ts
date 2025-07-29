import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Expense } from './expense.entity';
import { Category } from './category.entity';
import { ChatSession } from './chat-session.entity';
import { ExcelUpload } from './excel-upload.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 500 })
  profileImage?: string;

  @Field(() => String)
  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Field(() => [Expense])
  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @Field(() => [Category])
  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions: ChatSession[];

  @OneToMany(() => ExcelUpload, (upload) => upload.user)
  excelUploads: ExcelUpload[];
}