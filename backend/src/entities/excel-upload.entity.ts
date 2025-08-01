import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum UploadStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('excel_uploads')
export class ExcelUpload {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ length: 255 })
  filename: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ nullable: true })
  totalRows?: number;

  @Column({ default: 0 })
  processedRows: number;

  @Column({ default: 0 })
  failedRows: number;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PROCESSING,
  })
  status: UploadStatus;

  @Column({ type: 'jsonb', default: '[]' })
  errorLog: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.excelUploads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}