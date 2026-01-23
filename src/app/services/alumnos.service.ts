import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Alumno } from '../shared/interfaces/alumno';
import { CommonService } from '../shared/common.service';
import { ApiResponse } from '../shared/interfaces/api-response';
import { URL2_BASE } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlumnosService
{
  alumnos: Alumno[];
  alumno: Alumno;

  constructor(private http: HttpClient, private commonService: CommonService) { }

  setAlumno(alumno: Alumno) {
    this.alumno = alumno;
  }

  getAlumno(id_alumno : number | string) {
    return this.http.get<ApiResponse>(`${URL2_BASE}/alumnos/${id_alumno}`, { headers: this.commonService.headers });
  }

  getAllAlumnos() {
    return this.http.get<ApiResponse>(`${URL2_BASE}/alumnos/`, { headers: this.commonService.headers });
  }

  addAlumno(alumno: Alumno) {
    return this.http.post<ApiResponse>(`${URL2_BASE}/alumnos/`, alumno, { headers: this.commonService.headers });
  }

  editAlumno(alumno: Alumno) {
    return this.http.put<ApiResponse>(`${URL2_BASE}/alumnos/${alumno.id_alumno}`, alumno, { headers: this.commonService.headers });
  }

  deleteAlumno(id_alumno: number|string) {
    return this.http.delete<ApiResponse>(`${URL2_BASE}/alumnos/${id_alumno}`, {headers: this.commonService.headers });
  }
}
