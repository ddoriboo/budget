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

  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  lastMessage?: string;

  @Column({ name: 'last_activity' })
  lastActivity: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.chatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}