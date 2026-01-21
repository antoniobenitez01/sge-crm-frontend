import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const ENDPOINT = 'vacante';

@Injectable({
  providedIn: 'root'
})
export class VacantesService {
  constructor(private httpClient: HttpClient) { }

}
