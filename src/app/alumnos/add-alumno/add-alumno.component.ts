import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Entidad } from 'src/app/shared/interfaces/entidad';
import { EntidadesService } from 'src/app/services/entidades.service';
import { CLOSE, INVALID_FORM, ENTIDAD_ALUMNO } from '../../shared/messages';
import { ProvinciasService } from 'src/app/services/provincias.service';
import { Provincia } from 'src/app/shared/interfaces/provincia';
import { Ciclo } from 'src/app/shared/interfaces/ciclo';
import { CiclosService } from 'src/app/services/ciclos.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { Alumno } from 'src/app/shared/interfaces/alumno';

@Component({
  selector: 'app-add-alumno',
  templateUrl: './add-alumno.component.html',
  styleUrls: ['./add-alumno.component.scss']
})
export class AddAlumnoComponent implements OnInit {
  alumnoForm: FormGroup;

  alumnos : Alumno[];
  entidades : Entidad[];
  ciclos: Ciclo[];
  provincias: Provincia[];

  ALUMNO: String;

  constructor(public dialogRef: MatDialogRef<AddAlumnoComponent>,
    private snackBar: MatSnackBar,
    private servicioAlumno: AlumnosService,
    private servicioEntidad: EntidadesService,
    private servicioCiclo : CiclosService,
    private servicioProvincia: ProvinciasService,

  ){ }

  ngOnInit(): void {
    this.alumnoForm = new FormGroup({
      nif_nie: new FormControl(null, Validators.required),
      nombre: new FormControl(null, Validators.required),
      apellidos: new FormControl(null, Validators.required),
      fecha_nacimiento: new FormControl(null, Validators.required),
      entidad: new FormControl(null, Validators.required),
      ciclo: new FormControl(null, Validators.required),
      curso: new FormControl(null, Validators.required),
      vacante_asignada: new FormControl(null),
      telefono: new FormControl(null, Validators.required),
      direccion: new FormControl(null),
      cp: new FormControl(null),
      localidad: new FormControl(null),
      provincia: new FormControl(null),
      observaciones: new FormControl(null)
    });

    this.ALUMNO = ENTIDAD_ALUMNO;
    this.getEntidades();
    this.getCiclos();
    this.getProvincias();
    this.getAlumnos();
  }

  async confirmAdd() {
    if (this.alumnoForm.valid) {
      const formValue = this.alumnoForm.value;

      //  --- Conversión de fecha a YYYY-MM-DD
      const alumno : Alumno = {
        ...formValue,
        fecha_nacimiento : (formValue.fecha_nacimiento as Date).toISOString().split('T')[0]
      }

      //  - Comprobamos duplicados antes de ejecutar el servicio
      const duplicate = this.alumnos.find( alu => alu.nif_nie === alumno.nif_nie);
      if(duplicate){
        this.snackBar.open("Ya existe un Alumno con el mismo DNI", CLOSE, { duration: 5000 });
        return;
      }

      const RESPONSE = await this.servicioAlumno.addAlumno(alumno).toPromise();
      if (RESPONSE.ok) {
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
        this.dialogRef.close({ok: RESPONSE.ok, data: RESPONSE.data});
      } else {
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
      }
    } else {
      this.snackBar.open(INVALID_FORM, CLOSE, { duration: 5000 });
    }
  }

  async getAlumnos(){
    const RESPONSE = await this.servicioAlumno.getAllAlumnos().toPromise();
    if (RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
    }
  }

  async getEntidades(){
    const RESPONSE = await this.servicioEntidad.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      this.entidades = (RESPONSE.data as Entidad[]).filter(entidad => entidad.id_tipo_entidad === 1);
    }
  }

  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  async getProvincias(){
    const RESPONSE = await this.servicioProvincia.getAllProvincias().toPromise();
    if (RESPONSE.ok){
      this.provincias = RESPONSE.data as Provincia[];
    }
  }

  onNoClick() {
    this.dialogRef.close({ok: false});
  }
}
