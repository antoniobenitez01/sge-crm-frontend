import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
  selector: 'app-edit-alumno',
  templateUrl: './edit-alumno.component.html',
  styleUrls: ['./edit-alumno.component.scss']
})
export class EditAlumnoComponent implements OnInit {
  alumnoForm: FormGroup;

  entidades : Entidad[];
  ciclos: Ciclo[];
  provincias: Provincia[];

  ALUMNO: String;

  constructor(public dialogRef: MatDialogRef<EditAlumnoComponent>,
    @Inject(MAT_DIALOG_DATA) public alumno: Alumno,
    private snackBar: MatSnackBar,
    private servicioAlumno: AlumnosService,
    private servicioEntidad: EntidadesService,
    private servicioCiclo : CiclosService,
    private servicioProvincia: ProvinciasService,

  ){ }

  ngOnInit(): void {
    this.alumnoForm = new FormGroup({
      nif_nie: new FormControl(this.alumno?.nif_nie || '', { validators: Validators.required }),
      nombre: new FormControl(this.alumno?.nombre || '', { validators: Validators.required }),
      apellidos: new FormControl(this.alumno?.apellidos || '', { validators: Validators.required }),
      fecha_nacimiento: new FormControl(this.alumno?.fecha_nacimiento || '', { validators: Validators.required }),
      entidad: new FormControl(this.alumno?.entidad || '', { validators: Validators.required }),
      ciclo: new FormControl(this.alumno?.ciclo || '', { validators: Validators.required }),
      curso: new FormControl(this.alumno?.curso || '', { validators: Validators.required }),
      telefono: new FormControl(this.alumno?.telefono || '', { validators: Validators.required }),
      direccion: new FormControl(this.alumno?.direccion || ''),
      cp: new FormControl(this.alumno?.cp || ''),
      localidad: new FormControl(this.alumno?.localidad || ''),
      provincia: new FormControl(this.alumno?.provincia || ''),
      observaciones: new FormControl(this.alumno?.observaciones || '')
    });

    this.ALUMNO = ENTIDAD_ALUMNO;
    this.getEntidades();
    this.getCiclos();
    this.getProvincias();

  }

  async confirmEdit() {
    if (this.alumnoForm.valid) {
      const formValue = this.alumnoForm.value;

      //  --- Conversión de fecha a YYYY-MM-DD
      const alumno : Alumno = {
        ...formValue,
        id_alumno : this.alumno.id_alumno,
        fecha_nacimiento : formValue.fecha_nacimiento instanceof Date
          ? (formValue.fecha_nacimiento as Date).toISOString().split('T')[0]
          : formValue.fecha_nacimiento
      };

      const RESPONSE = await this.servicioAlumno.editAlumno(alumno).toPromise();
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
