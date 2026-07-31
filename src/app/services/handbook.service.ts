import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Handbook {
  id?: number;
  title: string;
  grade_level: string;
  file_url?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HandbookService {
  private apiUrl = environment.apiUrl + 'handbooks/admin';

  constructor(private http: HttpClient) { }

  getHandbooks(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  addHandbook(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  deleteHandbook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

