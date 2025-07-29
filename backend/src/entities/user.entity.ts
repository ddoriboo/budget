import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Expense } from './expense.entity';
import { Category } from './category.entity';
import { ChatSession } from './chat-session.entity';
import { ExcelUpload } from './excel-upload.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 500 })
  profileImage?: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions: ChatSession[];

  @OneToMany(() => ExcelUpload, (upload) => upload.user)
  excelUploads: ExcelUpload[];
}