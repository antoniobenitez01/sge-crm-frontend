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

@Component({
  selector: 'app-edit-vacante',
  templateUrl: './edit-vacante.component.html',
  styleUrls: ['./edit-vacante.component.scss']
})
export class EditVacanteComponent implements OnInit {
  vacanteForm: FormGroup;

  entidades : Entidad[];
  ciclos: Ciclo[];
  alumnos : Alumno[];
  alumnosAsignados : Alumno[];
  alumnosFiltrados : Alumno[];
  vacantes : Vacante[];

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

  ngOnInit(): void {

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
    this.getVacantes();

    this.vacanteForm.get('ciclo')?.valueChanges.subscribe(() => this.filterAlumnos());
    this.vacanteForm.get('curso')?.valueChanges.subscribe(() => this.filterAlumnos());
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
      const idAlumnos = (this.vacanteForm.value.idAlumnos as number[]) || []; // Si el valor es nulo, por defecto es un array vacío
      if(idAlumnos.length > this.vacanteForm.value.num_vacantes){
        this.snackBar.open("El número de Alumnos seleccionado excede el número de Vacantes disponibles.", CLOSE, { duration: 5000 });
        return;
      }
      const RESPONSE = await this.servicioVacantes.editVacante(vacante).toPromise();
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
              this.servicioVacanteXAlumno.addVacanteXAlumno(vacanteXAlumno).subscribe({
                next: res => console.log(`Alumno Asignado : ${idAlumno}`),
                error: err => console.error(err)
              });
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

  async getEntidades(){
    const RESPONSE = await this.servicioEntidad.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      this.entidades = (RESPONSE.data as Entidad[]);
    }
  }

  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  async getAlumnos(){
    const RESPONSE = await this.servicioAlumnos.getAllAlumnos().toPromise();
    if(RESPONSE.ok){
      this.alumnos = (RESPONSE.data as Alumno[]);
      this.filterAlumnos();
    }
  }

  async getAlumnosByVacanteId(id_vacante : number){
    const RESPONSE = await this.servicioAlumnos.getAlumnosByVacanteId(id_vacante).toPromise();
    if(RESPONSE.ok){
      this.alumnosAsignados = RESPONSE.data as Alumno[];
    }
  }

  async getVacantes(){
    const RESPONSE = await this.servicioVacantes.getAllVacantes().toPromise();
    if (RESPONSE.ok){
      this.vacantes = (RESPONSE.data as Vacante[]);
    }
  }

  filterAlumnos() {
    const selectedCiclo = this.vacanteForm.get('ciclo')?.value;
    const selectedCurso = this.vacanteForm.get('curso')?.value;

    if (selectedCiclo && selectedCurso && this.alumnos) {
      this.alumnosFiltrados = this.alumnos.filter(
        alumno => alumno.ciclo === selectedCiclo && alumno.curso === selectedCurso
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
