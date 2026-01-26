import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../shared/common.service';
import { ApiResponse } from '../shared/interfaces/api-response';
import { URL2_BASE } from 'src/environments/environment';
import { VacanteXAlumno } from '../shared/interfaces/vacantexalumno';

@Injectable({
  providedIn: 'root'
})
export class VacanteXAlumnoService
{
  vacantesXAlumnos: VacanteXAlumno[];
  vacanteXAlumno: VacanteXAlumno;

  constructor(private http: HttpClient, private commonService: CommonService) { }

  setVacantesXAlumnos(vacanteXAlumno: VacanteXAlumno) {
    this.vacanteXAlumno = vacanteXAlumno;
  }

  getVacanteXAlumno(id_vacante_x_alumno : number | string) {
    return this.http.get<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/${id_vacante_x_alumno}`, { headers: this.commonService.headers });
  }

  getVacanteXAlumnoByAlumnoId(id_alumno : number | string) {
    return this.http.get<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/alumno/${id_alumno}`, { headers: this.commonService.headers });
  }

  getAllVacantesXAlumnos() {
    return this.http.get<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/`, { headers: this.commonService.headers });
  }

  addVacanteXAlumno(vacanteXAlumno: VacanteXAlumno) {
    return this.http.post<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/`, vacanteXAlumno, { headers: this.commonService.headers });
  }

  editVacanteXAlumno(vacanteXAlumno: VacanteXAlumno) {
    return this.http.put<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/${vacanteXAlumno.id_vacante_x_alumno}`, vacanteXAlumno, { headers: this.commonService.headers });
  }

  deleteVacanteXAlumno(id_vacante_x_alumno: number | string) {
    return this.http.delete<ApiResponse>(`${URL2_BASE}/vacantesxalumnos/${id_vacante_x_alumno}`, {headers: this.commonService.headers });
  }
}
