import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column()
  userId: string;

  @Column({ length: 200, default: '새로운 대화' })
  title: string;

  @Column({ type: 'jsonb', default: '[]' })
  messages: Record<string, any>[];

  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  lastMessage?: string;

  @UpdateDateColumn()
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.chatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}