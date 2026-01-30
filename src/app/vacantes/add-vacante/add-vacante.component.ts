import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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
  selector: 'app-add-vacante',
  templateUrl: './add-vacante.component.html',
  styleUrls: ['./add-vacante.component.scss']
})
export class AddVacanteComponent implements OnInit {
  vacanteForm: FormGroup;

  entidades : Entidad[];                                            //  Lista de Entidades
  ciclos: Ciclo[];                                                  //  Lista de Ciclos
  alumnos : Alumno[];                                               //  Lista de Alumnos
  alumnosFiltrados : Alumno[];                                      //  Lista de Alumnos Filtrados
  vacantes : Vacante[];                                             //  Lista de Vacantes
  vacantesXAlumnos : VacanteXAlumno[];                              //  Lista de VacantesXAlumnos

  VACANTE: String;

  constructor(public dialogRef: MatDialogRef<AddVacanteComponent>,
    private snackBar: MatSnackBar,
    private servicioAlumnos : AlumnosService,                       //  SERVICIO - Alumnos
    private servicioVacantes : VacantesService,                     //  SERVICIO - Vacantes
    private servicioEntidad: EntidadesService,                      //  SERVICIO - Entidades
    private servicioCiclo : CiclosService,                          //  SERVICIO - Ciclos
    private servicioVacanteXAlumno : VacanteXAlumnoService          //  SERVICIO - VacanteXAlumno

  ){ }

  ngOnInit(): void {

    this.vacanteForm = new FormGroup({
      entidad: new FormControl(null, Validators.required),
      ciclo: new FormControl(null, Validators.required),
      curso: new FormControl(null, Validators.required),
      num_vacantes : new FormControl(null, Validators.required),
      idAlumnos : new FormControl({value: [], disabled : true}),
      observaciones : new FormControl(null),
    });

    this.VACANTE = ENTIDAD_VACANTE;
    this.getEntidades();
    this.getCiclos();
    this.getAlumnos();
    this.getVacantes();
    this.getVacantesXAlumnos();

    this.vacanteForm.get('ciclo')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Ciclo
    this.vacanteForm.get('curso')?.valueChanges.subscribe(() => this.filterAlumnos());    //  Subscripción de cambios en tiempo real en Form de Curso
  }

  //  CONFIRM ADD - Proceso de Creación de Vacante junto a sus VacantesXAlumnos asignados
  async confirmAdd() {
    if (this.vacanteForm.valid) {

      //  Construimos la Vacante de forma manual para evitar que se construya
      //  con el array de Alumnos introducido en el Form anteriormente
      const vacante : Vacante = {
          entidad : this.vacanteForm.value.entidad,
          ciclo: this.vacanteForm.value.ciclo,
          curso: this.vacanteForm.value.curso,
          num_vacantes: this.vacanteForm.value.num_vacantes,
          observaciones : this.vacanteForm.value.observaciones
      };

      //  --- Validación duplicados
      const duplicate = this.vacantes.find( vac => vac.entidad === vacante.entidad && vac.ciclo === vacante.ciclo && vac.curso === vacante.curso);
      if(duplicate){
        this.snackBar.open("Ya existe una Vacante con la misma Entidad, Ciclo y Curso", CLOSE, { duration: 5000 });
        return;
      }

      //  --- Validación num_alumnos < num_vacantes
      const idAlumnos = (this.vacanteForm.value.idAlumnos as number[]) || []; // Si el valor es nulo, por defecto es un array vacío
      if(idAlumnos.length > this.vacanteForm.value.num_vacantes){
        this.snackBar.open("El número de Alumnos seleccionado excede el número de Vacantes disponibles.", CLOSE, { duration: 5000 });
        return;
      }

      //  --- HTTP REQUEST : Add Vacante
      const RESPONSE = await this.servicioVacantes.addVacante(vacante).toPromise();
      if (RESPONSE.ok) {

        //  Creamos un objeto Vacante X Alumno a partir de la Vacante creada
        //  en base a los Alumnos seleccionados en el Form
        const vacanteCreada = RESPONSE.data as Vacante;
        if(idAlumnos.length > 0){
          await Promise.all(
            idAlumnos.map( async (idAlumno) => {
              const vacanteXAlumno : VacanteXAlumno = {
                id_vacante : vacanteCreada.id_vacante,
                id_alumno : idAlumno
              };
              //  --- HTTP REQUEST : Add VacanteXAlumno
              this.servicioVacanteXAlumno.addVacanteXAlumno(vacanteXAlumno).subscribe({
                next: res => console.log(`Alumno Asignado : ${idAlumno}`),
                error: err => console.error(err)
              });
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

  //  GET ALUMNOS - Recogida de Alumnos en BBDD y Filtrado de Alumnos
  async getAlumnos(){
    const RESPONSE = await this.servicioAlumnos.getAllAlumnos().toPromise();
    if(RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
      this.filterAlumnos();
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

  // FILTER ALUMNOS - Filtramos this.alumnos por Curso, Ciclo y Disponibilidad
  filterAlumnos() {

    const selectedCiclo = this.vacanteForm.get('ciclo')?.value;
    const selectedCurso = this.vacanteForm.get('curso')?.value;

    if (selectedCiclo && selectedCurso && this.alumnos) {

      this.alumnosFiltrados = this.alumnos.filter(alumno =>
        alumno.ciclo === selectedCiclo                                                            //  Filtro por Ciclo
        && alumno.curso === selectedCurso                                                         //  Filtro por Curso
        && this.vacantesXAlumnos.filter( vxa => vxa.id_alumno === alumno.id_alumno).length == 0   //  Filtro por Disponibilidad
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
