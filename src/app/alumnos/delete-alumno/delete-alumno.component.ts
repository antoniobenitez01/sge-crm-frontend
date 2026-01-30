import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE, ENTIDAD_ALUMNO } from '../../shared/messages';
import { Alumno } from 'src/app/shared/interfaces/alumno';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { VacanteXAlumno } from 'src/app/shared/interfaces/vacantexalumno';
import { VacanteXAlumnoService } from 'src/app/services/vacante_x_alumno.service';

@Component({
  selector: 'app-delete-alumno',
  templateUrl: './delete-alumno.component.html',
})
export class DeleteAlumnoComponent implements OnInit {

  vacantesXAlumnos : VacanteXAlumno[];
  ALUMNO: String;

  constructor(
    public dialogRef: MatDialogRef<DeleteAlumnoComponent>,
    @Inject(MAT_DIALOG_DATA) public alumno: Alumno,             //  DATOS - Alumno
    public servicioAlumno: AlumnosService,                      //  SERVICIO - Alumnos
    public servicioVacanteXAlumno : VacanteXAlumnoService,      //  SERVICIO - VacanteXAlumno
    public snackBar: MatSnackBar,
  )
  {
    this.getVacantesXAlumnos();
  }

  ngOnInit(): void {
    this.ALUMNO = ENTIDAD_ALUMNO;
  }

  onNoClick(): void {
    this.dialogRef.close({ ok: false });
  }

  //  GET VACANTESXALUMNOS - Recogida de relaciones VacantesXAlumnos en BBDD
  async getVacantesXAlumnos(){
    const RESPONSE = await this.servicioVacanteXAlumno.getAllVacantesXAlumnos().toPromise();
    if(RESPONSE.ok){
      this.vacantesXAlumnos = (RESPONSE.data as VacanteXAlumno[]);
    }
  }

  // CONFIRM DELETE - Proceso de Eliminación de Alumno
  async confirmDelete() {
    const RESPONSE = await this.servicioAlumno.deleteAlumno(this.alumno.id_alumno).toPromise();
    if (RESPONSE.ok) {
      this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
      this.dialogRef.close({ ok: RESPONSE.ok, data: RESPONSE.data });
    } else { this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 }); }
  }
}
