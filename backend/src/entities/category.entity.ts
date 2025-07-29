import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Expense } from './expense.entity';

@Entity('categories')
@Index('IDX_category_user', ['userId'])
@Index('IDX_category_user_name', ['userId', 'name'])
@Index('IDX_category_parent', ['parentId'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ length: 7, default: '#03C75A' })
  color: string;

  @Column({ length: 50, nullable: true })
  icon?: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: false })
  isIncome: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}