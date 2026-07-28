import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  Activity,
  ActivityInput,
  Project,
  ProjectEvmAnalysis,
} from './evm.models';

@Injectable({ providedIn: 'root' })
export class EvmApiService {
  private readonly http = inject(HttpClient);

  listProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${API_BASE_URL}/projects`);
  }

  /** Devuelve en una sola llamada las actividades con sus indicadores y el consolidado. */
  getAnalysis(projectId: string): Observable<ProjectEvmAnalysis> {
    return this.http.get<ProjectEvmAnalysis>(
      `${API_BASE_URL}/projects/${projectId}/evm`,
    );
  }

  listActivities(projectId: string): Observable<Activity[]> {
    return this.http.get<Activity[]>(
      `${API_BASE_URL}/projects/${projectId}/activities`,
    );
  }

  createActivity(
    projectId: string,
    input: ActivityInput,
  ): Observable<Activity> {
    return this.http.post<Activity>(
      `${API_BASE_URL}/projects/${projectId}/activities`,
      input,
    );
  }

  updateActivity(
    activityId: string,
    input: ActivityInput,
  ): Observable<Activity> {
    return this.http.patch<Activity>(
      `${API_BASE_URL}/activities/${activityId}`,
      input,
    );
  }

  deleteActivity(activityId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/activities/${activityId}`);
  }
}
