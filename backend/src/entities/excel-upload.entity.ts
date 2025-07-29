import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';

export enum UploadStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@ObjectType()
@Entity('excel_uploads')
export class ExcelUpload {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column()
  userId: string;

  @Field()
  @Column({ length: 255 })
  filename: string;

  @Column({ length: 500 })
  filePath: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  totalRows?: number;

  @Field(() => Int)
  @Column({ default: 0 })
  processedRows: number;

  @Field(() => Int)
  @Column({ default: 0 })
  failedRows: number;

  @Field()
  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PROCESSING,
  })
  status: UploadStatus;

  @Field(() => [String])
  @Column({ type: 'jsonb', default: '[]' })
  errorLog: string[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.excelUploads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}