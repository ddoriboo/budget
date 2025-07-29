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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';
import { Expense } from './expense.entity';

@ObjectType()
@Entity('categories')
@Index('IDX_category_user', ['userId'])
@Index('IDX_category_user_name', ['userId', 'name'])
@Index('IDX_category_parent', ['parentId'])
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column()
  userId: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field(() => ID, { nullable: true })
  @Column({ nullable: true })
  parentId?: string;

  @Field()
  @Column({ length: 7, default: '#03C75A' })
  color: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  icon?: string;

  @Field()
  @Column({ default: false })
  isSystem: boolean;

  @Field()
  @Column({ default: false })
  isIncome: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @Field(() => [Category])
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Field(() => [Expense])
  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}