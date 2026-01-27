import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Entidad } from 'src/app/shared/interfaces/entidad';
import { EntidadesService } from 'src/app/services/entidades.service';
import { CLOSE, INVALID_FORM, ENTIDAD_VACANTE } from '../../shared/messages';
import { Ciclo } from 'src/app/shared/interfaces/ciclo';
import { CiclosService } from 'src/app/services/ciclos.service';
import { VacantesService } from 'src/app/services/vacantes.service';
import { Vacante } from 'src/app/shared/interfaces/vacante';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { Alumno } from 'src/app/shared/interfaces/alumno';
import { VacanteXAlumno } from 'src/app/shared/interfaces/vacantexalumno';
import { VacanteXAlumnoService } from 'src/app/services/vacante_x_alumno.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-edit-vacante',
  templateUrl: './edit-vacante.component.html',
  styleUrls: ['./edit-vacante.component.scss']
})
export class EditVacanteComponent implements OnInit {
  vacanteForm: FormGroup;

  entidades : Entidad[];                                            //  Lista de Entidades
  ciclos: Ciclo[];                                                  //  Lista de Ciclos
  alumnos : Alumno[];                                               //  Lista de Alumnos
  alumnosAsignados : Alumno[];                                      //  Lista de Alumnos seleccionados en el Form
  alumnosFiltrados : Alumno[];                                      //  Lista de Alumnos filtrados por Ciclo, Curso y Disponibilidad
  alumnosOriginales : number[];                                     //  Lista de Alumnos originalmente asignados a la Vacante
  vacantes : Vacante[];                                             //  Lista de Vacantes
  vacantesXAlumnos : VacanteXAlumno[];                              //  Lista de VacantesXAlumnos

  VACANTE: String;

  constructor(public dialogRef: MatDialogRef<EditVacanteComponent>,
    @Inject(MAT_DIALOG_DATA) public vacante: Vacante,
    private snackBar: MatSnackBar,
    private servicioAlumnos : AlumnosService,
    private servicioVacantes : VacantesService,
    private servicioEntidad: EntidadesService,
    private servicioCiclo : CiclosService,
    private servicioVacanteXAlumno : VacanteXAlumnoService
  ){ }

  ngOnInit() {

    this.vacanteForm = new FormGroup({
      entidad: new FormControl(this.vacante?.entidad, Validators.required),
      ciclo: new FormControl(this.vacante?.ciclo, Validators.required),
      curso: new FormControl(this.vacante?.curso, Validators.required),
      num_vacantes : new FormControl(this.vacante?.num_vacantes, Validators.required),
      idAlumnos : new FormControl({value: [], disabled : true}),
      observaciones : new FormControl(null),
    });

    this.VACANTE = ENTIDAD_VACANTE;
    this.getEntidades();
    this.getCiclos();
    this.getAlumnos();
    this.getAlumnosByVacanteId(this.vacante.id_vacante);
    this.getVacantes();
    this.getVacantesXAlumnos();

    this.vacanteForm.get('ciclo')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Ciclo
    this.vacanteForm.get('curso')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Curso
  }

  async confirmEdit() {
    if (this.vacanteForm.valid) {

      //  Construimos la Vacante de forma manual para evitar que se construya
      //  con el array de Alumnos introducido en el Form anteriormente
      const vacante : Vacante = {
        id_vacante : this.vacante.id_vacante,
        entidad : this.vacanteForm.value.entidad,
        ciclo: this.vacanteForm.value.ciclo,
        curso: this.vacanteForm.value.curso,
        num_vacantes: this.vacanteForm.value.num_vacantes,
        observaciones : this.vacanteForm.value.observaciones
      };

      //  - Comprobamos que el número de alumnos seleccionado no es mayor que el número de vacantes
      const idAlumnos = this.vacanteForm.value.idAlumnos as number[] || [];
      if(idAlumnos.length > this.vacanteForm.value.num_vacantes){
        this.snackBar.open("El número de Alumnos seleccionado excede el número de Vacantes disponibles.", CLOSE, { duration: 5000 });
        return;
      }

      const RESPONSE = await this.servicioVacantes.editVacante(vacante).toPromise();
      if (RESPONSE.ok) {

        //  Creamos un objeto Vacante X Alumno a partir de la Vacante creada
        //  en base a los Alumnos seleccionados en el Form
        const vacanteCreada = RESPONSE.data as Vacante;
        const alumnosNuevos = idAlumnos.filter(id => !this.alumnosOriginales.includes(id));           //  Lista de Alumnos a añadir
        const alumnosEliminar = this.alumnosOriginales.filter(id => !idAlumnos.includes(id));         //  Lista de Alumnos a eliminar

        if(idAlumnos){

          // Esperamos a que se realize la insercción de los Alumnos a añadir
          await Promise.all(
            alumnosNuevos.map( idAlumno => {
              //  --- Creamos nuevo objeto VacanteXAlumno
              const vacanteXAlumno : VacanteXAlumno = {
                id_vacante : vacanteCreada.id_vacante,
                id_alumno : idAlumno
              };
              //  --- Lo añadimos a la Base de Datos
              return this.servicioVacanteXAlumno.addVacanteXAlumno(vacanteXAlumno).toPromise();
            })
          );

          // Esperamos a que se realize la eliminación de los Alumnos a eliminar
          await Promise.all(
            alumnosEliminar.map( idAlumno => {
              //  --- Encontramos objeto VacanteXAlumno con el mismo id_alumno
              const relacion = this.vacantesXAlumnos.find( vxa => vxa.id_alumno === idAlumno );
              //  --- Si existe, lo eliminamos de la Base de Datos
              if(relacion){
                return this.servicioVacanteXAlumno.deleteVacanteXAlumno(relacion.id_vacante_x_alumno).toPromise();
              }
            })
          );

        }
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
        this.dialogRef.close({ok: RESPONSE.ok, data: RESPONSE.data});
      } else {
        this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
      }

    } else {
      this.snackBar.open(INVALID_FORM, CLOSE, { duration: 5000 });
    }
  }

  //  GET ENTIDADES - Recogemos todas las Entidades de la Base de Datos
  async getEntidades(){
    const RESPONSE = await this.servicioEntidad.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      this.entidades = (RESPONSE.data as Entidad[]);
    }
  }

  //  GET CICLOS - Recogemos todos los Ciclos de la Base de Datos
  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  //  GET ALUMNOS - Recogemos todos los Alumnos de la Base de Datos y los filtramos por Ciclo, Curso y Disponibilidad
  async getAlumnos(){
    const RESPONSE = await this.servicioAlumnos.getAllAlumnos().toPromise();
    if(RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
      this.filterAlumnos();
    }
  }

  //  GET VACANTESXALUMNOS - Recogemos todas las relaciones VacantesXAlumnos de la Base de Datos
  async getVacantesXAlumnos(){
    const RESPONSE = await this.servicioVacanteXAlumno.getAllVacantesXAlumnos().toPromise();
    if(RESPONSE.ok){
      this.vacantesXAlumnos = (RESPONSE.data as VacanteXAlumno[]);
    }
  }

  //  GET ALUMNOS BY VACANTE ID - Recogemos todos los Alumnos asignados a una id_vacante de la Base de Datos
  async getAlumnosByVacanteId(id_vacante : number){
    const RESPONSE = await this.servicioAlumnos.getAlumnosByVacanteId(id_vacante).toPromise();
    if(RESPONSE.ok){
      this.alumnosAsignados = RESPONSE.data as Alumno[];
      this.alumnosOriginales = this.alumnosAsignados.map( alu => alu.id_alumno );
      this.vacanteForm.patchValue({
        idAlumnos : this.alumnosOriginales
      })
    }
  }

  getVacanteByAlumnoId(id_alumno : number){
    return this.servicioVacanteXAlumno.getVacanteXAlumnoByAlumnoId(id_alumno)
    .pipe( catchError( error => of(undefined)));
  }

  //  GET VACANTES - Recogemos todas las Vacantes de la Base de Datos
  async getVacantes(){
    const RESPONSE = await this.servicioVacantes.getAllVacantes().toPromise();
    if (RESPONSE.ok){
      this.vacantes = (RESPONSE.data as Vacante[]);
    }
  }

  // FILTER ALUMNOS - Filtramos this.alumnos por Curso, Ciclo y Disponibilidad
  filterAlumnos() {
    const selectedCiclo = this.vacanteForm.get('ciclo')?.value;
    const selectedCurso = this.vacanteForm.get('curso')?.value;
    if (selectedCiclo && selectedCurso && this.alumnos) {
      this.alumnosFiltrados = this.alumnos.filter(alumno =>
        alumno.ciclo === selectedCiclo
        && alumno.curso === selectedCurso
        && this.getVacanteByAlumnoId(alumno.id_alumno) == undefined
      );

      if (this.alumnosFiltrados.length > 0) {
        this.vacanteForm.get('idAlumnos')?.enable();
      } else {
        this.vacanteForm.get('idAlumnos')?.disable();
      }
    } else {
      this.alumnosFiltrados = [];
      this.vacanteForm.get('idAlumnos')?.disable();
    }
  }

  onNoClick() {
    this.dialogRef.close({ok: false});
  }
}
