import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  MONETARY_PRECISION,
  MONETARY_SCALE,
  NAME_MAX_LENGTH,
  PERCENT_PRECISION,
  PERCENT_SCALE,
} from '../common/column.constants';
import { numericTransformer } from '../common/numeric.transformer';
import { Project } from '../projects/project.entity';

/**
 * Los cuatro campos numéricos se declaran NUMERIC y pasan por `numericTransformer`, de modo que el
 * dominio siempre los recibe como `number`. Los nombres de las propiedades coinciden con los del
 * modelo EVM, así que la entidad se puede entregar al calculador sin una capa de traducción.
 */
@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: NAME_MAX_LENGTH })
  name: string;

  /** BAC — presupuesto total planificado. */
  @Column({
    name: 'budget_at_completion',
    type: 'numeric',
    precision: MONETARY_PRECISION,
    scale: MONETARY_SCALE,
    transformer: numericTransformer,
  })
  budgetAtCompletion: number;

  /** Porcentaje de avance planificado a la fecha de corte, de 0 a 100. */
  @Column({
    name: 'planned_progress_percent',
    type: 'numeric',
    precision: PERCENT_PRECISION,
    scale: PERCENT_SCALE,
    transformer: numericTransformer,
  })
  plannedProgressPercent: number;

  /** Porcentaje de avance real completado, de 0 a 100. */
  @Column({
    name: 'actual_progress_percent',
    type: 'numeric',
    precision: PERCENT_PRECISION,
    scale: PERCENT_SCALE,
    transformer: numericTransformer,
  })
  actualProgressPercent: number;

  /** AC — costo real incurrido hasta la fecha. */
  @Column({
    name: 'actual_cost',
    type: 'numeric',
    precision: MONETARY_PRECISION,
    scale: MONETARY_SCALE,
    transformer: numericTransformer,
  })
  actualCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
