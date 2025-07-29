import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Entity('chat_sessions')
export class ChatSession {
  @Field(() => ID)
  @PrimaryColumn({ length: 100 })
  id: string;

  @Field(() => ID)
  @Column()
  userId: string;

  @Field()
  @Column({ length: 200, default: '새로운 대화' })
  title: string;

  @Field(() => String)
  @Column({ type: 'jsonb', default: '[]' })
  messages: Record<string, any>[];

  @Field(() => String)
  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  lastMessage?: string;

  @Field()
  @UpdateDateColumn()
  lastMessageAt: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.chatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}