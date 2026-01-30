import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
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
    private servicioAlumnos : AlumnosService,                       //  SERVICIO - Alumnos
    private servicioVacantes : VacantesService,                     //  SERVICIO - Vacantes
    private servicioEntidad: EntidadesService,                      //  SERVICIO - Entidades
    private servicioCiclo : CiclosService,                          //  SERVICIO - Ciclos
    private servicioVacanteXAlumno : VacanteXAlumnoService          //  SERVICIO - VacanteXAlumno
  ){ }

  async ngOnInit() {

    this.vacanteForm = new FormGroup({
      entidad: new FormControl(this.vacante?.entidad, Validators.required),
      ciclo: new FormControl(this.vacante?.ciclo, Validators.required),
      curso: new FormControl(this.vacante?.curso, Validators.required),
      num_vacantes : new FormControl(this.vacante?.num_vacantes, Validators.required),
      idAlumnos : new FormControl({value: [], disabled : true}),
      observaciones : new FormControl(null),
    });

    this.VACANTE = ENTIDAD_VACANTE;
    await Promise.all([
      this.getEntidades(),
      this.getCiclos(),
      this.getAlumnos(),
      this.getAlumnosByVacanteId(this.vacante.id_vacante),
      this.getVacantes(),
      this.getVacantesXAlumnos()
    ]);

    this.filterAlumnos();

    this.vacanteForm.get('ciclo')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Ciclo
    this.vacanteForm.get('curso')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Curso
  }

  //  CONFIRM EDIT - Proceso de Actualización de Vacante junto a la creación y eliminación de VacantesXAlumnos asignados
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

      //  --- HTTP REQUEST : Edit Vacante
      const RESPONSE = await this.servicioVacantes.editVacante(vacante).toPromise();
      if (RESPONSE.ok) {

        const vacanteCreada = RESPONSE.data as Vacante;                                               //  Vacante creada con exito
        const alumnosNuevos = idAlumnos.filter(id => !this.alumnosOriginales.includes(id));           //  Lista de Alumnos a añadir
        const alumnosEliminar = this.alumnosOriginales.filter(id => !idAlumnos.includes(id));         //  Lista de Alumnos a eliminar

        if(idAlumnos){

          //  Proceso de inserción de alumnosNuevos
          await Promise.all(
            alumnosNuevos.map( idAlumno => {
              //  --- Creación nuevo objeto VacanteXAlumno
              const vacanteXAlumno : VacanteXAlumno = {
                id_vacante : vacanteCreada.id_vacante,
                id_alumno : idAlumno
              };
              //  --- HTTP REQUEST : Add VacanteXAlumno
              return this.servicioVacanteXAlumno.addVacanteXAlumno(vacanteXAlumno).toPromise();
            })
          );

          //  Proceso de eliminación de alumnosEliminar
          await Promise.all(
            alumnosEliminar.map( idAlumno => {
              //  --- Búsqueda objeto VacanteXAlumno con el mismo id_alumno
              const relacion = this.vacantesXAlumnos.find( vxa => vxa.id_alumno === idAlumno );
              if(relacion){
                //  --- HTTP REQUEST : Delete VacanteXAlumno
                return this.servicioVacanteXAlumno.deleteVacanteXAlumno(relacion.id_vacante_x_alumno).toPromise();
              }
            })
          );

        }
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

  //  GET ENTIDADES - Recogida de Entidades en BBDD
  async getEntidades(){
    const RESPONSE = await this.servicioEntidad.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      this.entidades = (RESPONSE.data as Entidad[]);
    }
  }

  //  GET CICLOS - Recogida de Ciclos en BBDD
  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  //  GET ALUMNOS - Recogida de Alumnos en BBDD
  async getAlumnos(){
    const RESPONSE = await this.servicioAlumnos.getAllAlumnos().toPromise();
    if(RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
    }
  }

  //  GET VACANTES - Recogida de Vacantes en BBDD
  async getVacantes(){
    const RESPONSE = await this.servicioVacantes.getAllVacantes().toPromise();
    if (RESPONSE.ok){
      this.vacantes = (RESPONSE.data as Vacante[]);
    }
  }

  //  GET VACANTESXALUMNOS - Recogida de relaciones VacantesXAlumnos en BBDD
  async getVacantesXAlumnos(){
    const RESPONSE = await this.servicioVacanteXAlumno.getAllVacantesXAlumnos().toPromise();
    if(RESPONSE.ok){
      this.vacantesXAlumnos = (RESPONSE.data as VacanteXAlumno[]);
    }
  }

  //  GET ALUMNOS BY VACANTE ID - Recogida de Alumnos en BBDD asignados a una Vacante con id_vacante
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

  // FILTER ALUMNOS - Filtramos this.alumnos por Curso, Ciclo y Disponibilidad
  filterAlumnos() {

    const selectedCiclo = this.vacanteForm.get('ciclo')?.value;
    const selectedCurso = this.vacanteForm.get('curso')?.value;

    if (selectedCiclo && selectedCurso && this.alumnos) {

      this.alumnosFiltrados = this.alumnos.filter(alumno =>
        alumno.ciclo === selectedCiclo                                                            //  Filtro por Ciclo
        && alumno.curso === selectedCurso                                                         //  Filtro por Curso
        && this.vacantesXAlumnos.filter( vxa => vxa.id_alumno === alumno.id_alumno && vxa.id_vacante != this.vacante.id_vacante ).length == 0
      );

      //  Si encontramos Alumnos Filtrados, activamos el Menú Dropdown
      if (this.alumnosFiltrados.length > 0) {
        this.vacanteForm.get('idAlumnos')?.enable();
      } else {
        this.vacanteForm.get('idAlumnos')?.disable();
      }
    } else {
      //  Por defecto, Alumnos Filtrados está vacío y el Menú Dropdwon desactivado
      this.alumnosFiltrados = [];
      this.vacanteForm.get('idAlumnos')?.disable();
    }
  }

  onNoClick() {
    this.dialogRef.close({ok: false});
  }
}
