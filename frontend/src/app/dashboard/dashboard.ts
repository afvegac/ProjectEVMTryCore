import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EvmApiService } from '../core/evm-api.service';
import {
  Activity,
  ActivityInput,
  Project,
  ProjectEvmAnalysis,
} from '../core/evm.models';
import { ActivitiesTable } from './activities-table/activities-table';
import { ActivityForm } from './activity-form/activity-form';
import { EvmBarChart } from './evm-bar-chart/evm-bar-chart';
import { SummaryCards } from './summary-cards/summary-cards';

/**
 * Vista principal: elige el proyecto, registra actividades y muestra el análisis.
 *
 * El estado vive aquí y los componentes de abajo son presentacionales, así que cualquier cambio
 * dispara una única recarga del análisis y toda la pantalla queda coherente. Los indicadores nunca
 * se calculan en el cliente: siempre vienen del backend, que es la única fuente de las fórmulas.
 */
@Component({
  selector: 'app-dashboard',
  imports: [ActivitiesTable, ActivityForm, EvmBarChart, SummaryCards],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly api = inject(EvmApiService);

  protected readonly projects = signal<Project[]>([]);
  protected readonly selectedProjectId = signal<string | null>(null);
  protected readonly analysis = signal<ProjectEvmAnalysis | null>(null);
  protected readonly editingActivity = signal<Activity | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly activities = signal<Activity[]>([]);

  ngOnInit(): void {
    this.api.listProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);

        const first = projects[0];

        if (first !== undefined) {
          this.selectProject(first.id);
        }
      },
      error: (error: unknown) => this.errorMessage.set(describeError(error)),
    });
  }

  protected selectProject(projectId: string): void {
    this.selectedProjectId.set(projectId);
    this.editingActivity.set(null);
    this.reload();
  }

  protected onProjectChange(event: Event): void {
    this.selectProject((event.target as HTMLSelectElement).value);
  }

  protected startEditing(activityId: string): void {
    this.editingActivity.set(
      this.activities().find((activity) => activity.id === activityId) ?? null,
    );
  }

  protected cancelEditing(): void {
    this.editingActivity.set(null);
  }

  protected saveActivity(input: ActivityInput): void {
    const projectId = this.selectedProjectId();

    if (projectId === null) {
      return;
    }

    const editing = this.editingActivity();
    const request =
      editing === null
        ? this.api.createActivity(projectId, input)
        : this.api.updateActivity(editing.id, input);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingActivity.set(null);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(describeError(error));
      },
    });
  }

  protected deleteActivity(activityId: string): void {
    this.api.deleteActivity(activityId).subscribe({
      next: () => {
        if (this.editingActivity()?.id === activityId) {
          this.editingActivity.set(null);
        }

        this.reload();
      },
      error: (error: unknown) => this.errorMessage.set(describeError(error)),
    });
  }

  /**
   * Se piden juntos el análisis y las actividades sin procesar: el primero alimenta la tabla y la
   * gráfica, y las segundas el formulario de edición, que necesita los valores tal como se
   * capturaron y no sus indicadores derivados.
   */
  private reload(): void {
    const projectId = this.selectedProjectId();

    if (projectId === null) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      analysis: this.api.getAnalysis(projectId),
      activities: this.api.listActivities(projectId),
    }).subscribe({
      next: ({ analysis, activities }) => {
        this.analysis.set(analysis);
        this.activities.set(activities);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(describeError(error));
      },
    });
  }
}

/**
 * El backend responde con una forma de error única para todos los códigos, así que basta un solo
 * camino de traducción en lugar de un caso por endpoint.
 */
function describeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }

  if (error.status === 0) {
    return 'No se pudo conectar con el API. Verifica que esté corriendo en http://localhost:3000.';
  }

  const body = error.error as { message?: string[] } | null;

  return body?.message?.length ? body.message.join('. ') : error.message;
}
