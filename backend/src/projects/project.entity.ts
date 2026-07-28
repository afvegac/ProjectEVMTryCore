import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from '../activities/activity.entity';
import { NAME_MAX_LENGTH } from '../common/column.constants';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: NAME_MAX_LENGTH })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Activity, (activity) => activity.project)
  activities: Activity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
