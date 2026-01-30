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

  alumnos : Alumno[];                                                 //  Lista de Alumnos
  entidades : Entidad[];                                              //  Lista de Entidades
  ciclos: Ciclo[];                                                    //  Lista de Ciclos
  provincias: Provincia[];                                            //  Lista de Provincias

  ALUMNO: String;

  constructor(public dialogRef: MatDialogRef<EditAlumnoComponent>,
    @Inject(MAT_DIALOG_DATA) public alumno: Alumno,
    private snackBar: MatSnackBar,
    private servicioAlumno: AlumnosService,                           //  SERVICIO - Vacantes
    private servicioEntidad: EntidadesService,                        //  SERVICIO - Entidades
    private servicioCiclo : CiclosService,                            //  SERVICIO - Ciclos
    private servicioProvincia: ProvinciasService,                     //  SERVICIO - Provincias

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
    this.getAlumnos();
  }

  //  CONFIRM EDIT - Proceso de Actualización de Alumno
  async confirmEdit() {
    if (this.alumnoForm.valid) {
      const formValue = this.alumnoForm.value;

      //  --- Conversión fecha_nacimiento a YYYY-MM-DD
      const alumno : Alumno = {
        ...formValue,
        id_alumno : this.alumno.id_alumno,
        fecha_nacimiento : formValue.fecha_nacimiento instanceof Date
          ? (formValue.fecha_nacimiento as Date).toISOString().split('T')[0]
          : formValue.fecha_nacimiento,
      };

      //  --- Validación NIF / NIE
      const dniRegex = /^\d{8}[A-Za-z]$/;
      const nieRegex = /^[XYZ]\d{7}[A-Za-z]$/;
      if(!dniRegex.test(this.alumnoForm.value.nif_nie) && !nieRegex.test(this.alumnoForm.value.nif_nie)){
        this.snackBar.open("NIF / NIE debe ser válido", CLOSE, { duration: 5000 });
        return;
      }

      //  --- Validación teléfono
      const regex = /^\+34\d{9}$|^\d{9}$/;
      if(!regex.test(this.alumnoForm.value.telefono)){
        this.snackBar.open("Teléfono debe tener 9 dígitos y seguir el Formato Internacional", CLOSE, { duration: 5000 });
        return;
      }

      //  --- Validación duplicados
      const duplicate = this.alumnos.find( alu => alu.nif_nie === alumno.nif_nie);
      if(duplicate){
        this.snackBar.open("Ya existe un Alumno con el mismo DNI", CLOSE, { duration: 5000 });
        return;
      }

      //  --- HTTP REQUEST : Edit Alumno
      const RESPONSE = await this.servicioAlumno.editAlumno(alumno).toPromise();
      if (RESPONSE.ok) {
        //  Si todo ha funcionado de forma correcta, mostramos el mensaje recibido
        //  y cerramos nuestro Dialog de Añadir Vacante
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
        this.dialogRef.close({ok: RESPONSE.ok, data: RESPONSE.data});
      } else {
        //  Mostramos el mensaje recibido si RESPONSE no es OK
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
      }
    } else {
      this.snackBar.open(INVALID_FORM, CLOSE, { duration: 5000 });
    }
  }

  //  GET ALUMNOS - Recogida de Alumnos en BBDD
  async getAlumnos(){
    const RESPONSE = await this.servicioAlumno.getAllAlumnos().toPromise();
    if (RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
    }
  }

  //  GET ENTIDADES - Recogida de Entidades en BBDD
  async getEntidades(){
    const RESPONSE = await this.servicioEntidad.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      this.entidades = (RESPONSE.data as Entidad[]).filter(entidad => entidad.id_tipo_entidad === 1);
    }
  }

  //  GET CICLOS - Recogida de Ciclos en BBDD
  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  //  GET PROVINCIAS - Recogida de Provincias en BBDD
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
