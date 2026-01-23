import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vacante } from '../shared/interfaces/vacante';
import { CommonService } from '../shared/common.service';
import { ApiResponse } from '../shared/interfaces/api-response';
import { URL2_BASE } from 'src/environments/environment';

const ENDPOINT = 'vacante';

@Injectable({
  providedIn: 'root'
})
export class VacantesService
{
  vacantes: Vacante[];
  vacante: Vacante;

  constructor(private http: HttpClient, private commonService: CommonService) { }

  setVacante(vacante: Vacante) {
    this.vacante = vacante;
  }

  getVacante(id_vacante : number | string) {
    return this.http.get<ApiResponse>(`${URL2_BASE}/vacantes/${id_vacante}`, { headers: this.commonService.headers });
  }

  getAllVacantes() {
    return this.http.get<ApiResponse>(`${URL2_BASE}/vacantes/`, { headers: this.commonService.headers });
  }

  addVacante(vacante: Vacante) {
    return this.http.post<ApiResponse>(`${URL2_BASE}/vacantes/`, vacante, { headers: this.commonService.headers });
  }

  editVacante(vacante: Vacante) {
    return this.http.put<ApiResponse>(`${URL2_BASE}/vacantes/${vacante.id_vacante}`, vacante, { headers: this.commonService.headers });
  }

  deleteVacante(id_vacante: number|string) {
    return this.http.delete<ApiResponse>(`${URL2_BASE}/vacantes/${id_vacante}`, {headers: this.commonService.headers });
  }
}
