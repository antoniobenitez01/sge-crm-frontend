import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Alumno } from '../shared/interfaces/alumno';
import { FormControl } from '@angular/forms';
import { Permises } from '../shared/interfaces/api-response';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { EntidadesService } from '../services/entidades.service';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlumnosService } from '../services/alumnos.service';
import { Entidad } from '../shared/interfaces/entidad';
import { CiclosService } from '../services/ciclos.service';
import { Ciclo } from '../shared/interfaces/ciclo';
import { AddVacanteComponent } from './add-vacante/add-vacante.component';
import { DeleteVacanteComponent } from './delete-vacante/delete-vacante.component';
import { EditVacanteComponent } from './edit-vacante/edit-vacante.component';
import { Vacante } from '../shared/interfaces/vacante';
import { VacantesService } from '../services/vacantes.service';

@Component({
  selector: 'app-vacantes',
  templateUrl: './vacantes.component.html',
  styleUrls: ['./vacantes.component.scss']
})
export class VacantesComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: MatTableDataSource<Vacante> = new MatTableDataSource();

  //  VARIABLES DE FILTRO
  idVacanteFilter = new FormControl();                  //  id_vacante
  vacanteEntidadFilter = new FormControl();             //  entidad
  vacanteCicloFilter = new FormControl();               //  ciclo
  vacanteCursoFilter = new FormControl();               //  curso
  vacanteNumVacantesFilter = new FormControl();         //  num_vacantes
  vacanteNumAlumnosFilter = new FormControl();          //  num_alumnos

  //  VARIABLES DE SELECCIÓN
  vacantesSelected: Vacante[] = [];
  selection: SelectionModel<Vacante>;

  //  VARIABLES PAGINATOR
  pageSizeChecked: number;
  pageIndexChecked: number;
  isChecked = false;
  isCheckedAll = false;

  //  VARIABLES DATOS Y PERMISOS
  vacante: Vacante;
  permises: Permises;

  displayedColumns: string[];
  private filterValues = { id_vacante: '', entidad_display: '', ciclo_display: '', curso: '', num_vacantes_display: '', num_alumnos: '' };

  constructor(
      public dialog: MatDialog,
      private vacantesService : VacantesService,        //  SERVICIO - Vacantes
      private alumnosService: AlumnosService,           //  SERVICIO - Alumnos
      private entidadesService: EntidadesService,       //  SERVICIO - Entidades
      private ciclosService : CiclosService,            //  SERVICIO - Ciclos
      private overlay: Overlay,
      private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.getVacantes();
  }

  //  GET VACANTES - Recogida de Vacantes en BBDD y ajuste de objeto para visualización en tabla
  async getVacantes() {
    const RESPONSE = await this.vacantesService.getAllVacantes().toPromise();
    this.permises = RESPONSE.permises;

    if (RESPONSE.ok) {

      const entidades = await this.getEntidades();                              //  Recogida de Entidades en BBDD
      const ciclos = await this.getCiclos();                                    //  Recogida de Ciclos en BBDD

      this.vacantesService.vacantes = await Promise.all((RESPONSE.data as Vacante[])
      .map(async vacante => {

          let entidad = entidades.find(e => e.id_entidad === vacante.entidad);  //  Búsqueda de Entidad con misma id_entidad
          let ciclo = ciclos.find(c => c.id_ciclo === vacante.ciclo);           //  Búsqueda de Ciclo con mismo id_ciclo
          let alumnos = await this.getAlumnosByVacanteId(vacante.id_vacante);   //  Búsqueda de Alumnos asignados a Vacante

          return {
            //  Asignación de Valores para Visualización en Tabla de Vacantes
            ...vacante,
            entidad_display: entidad ? entidad.entidad : "Sin Entidad",         //  Nombre de Entidad -> entidad_display
            ciclo_display: ciclo ? ciclo.ciclo : "Sin Ciclo",                   //  Nombre de Ciclo -> ciclo_display
            num_alumnos: alumnos.length,                                        //  Número de Alumnos Asignados
            num_vacantes_display: vacante.num_vacantes - alumnos.length         //  Número de Vacantes Disponibles
          };

        })
      );

      this.displayedColumns = ['id_vacante', 'entidad_display', 'ciclo_display', 'curso', 'num_vacantes_display', 'num_alumnos' ,'actions'];
      this.dataSource.data = this.vacantesService.vacantes || [];
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = this.createFilter();
      this.selection = new SelectionModel<Vacante>(false, [this.vacante]);

      this.onChanges();
    }
  }

  //  ADD VACANTE -  Apertura de Dialog 'AddVacanteComponent'
  async addVacante() {
    const dialogRef = this.dialog.open(AddVacanteComponent, { scrollStrategy: this.overlay.scrollStrategies.noop(), disableClose: true });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  DELETE VACANTE - Apertura de Dialog 'DeleteVacanteComponent' con datos de Vacante
  async deleteVacante(vacante: Vacante) {
    const dialogRef = this.dialog.open(DeleteVacanteComponent, { data: vacante, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  EDIT VACANTE - Apertura de Dialog 'EditVacanteComponent' con datos de Vacante
  async editVacante(vacante: Vacante) {
    const dialogRef = this.dialog.open(EditVacanteComponent, { data: vacante, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  GET ALUMNOS BY VACANTE ID - Recogida de Alumnos en BBDD asignados a una Vacante con id_vacante
  async getAlumnosByVacanteId(id_vacante : number){
    const RESPONSE = await this.alumnosService.getAlumnosByVacanteId(id_vacante).toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Alumno[];
    }
  }

  //  GET ENTIDADES - Recogida de Entidades en BBDD
  async getEntidades(){
    const RESPONSE = await this.entidadesService.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Entidad[];
    }
  }

  //  GET CICLOS - Recogida de Ciclos en BBDD
  async getCiclos(){
    const RESPONSE = await this.ciclosService.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Ciclo[];
    }
  }

  // CREATE FILTER - Creación de Filtros de Tabla de Vacantes
  createFilter(): (vacante: Vacante, filter: string) => boolean {
    const filterFunction = (vacante: Vacante, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      return vacante.id_vacante.toString().indexOf(searchTerms.id_alumno) !== -1
        && vacante.entidad_display.toLowerCase().indexOf(searchTerms.entidad.toLowerCase()) !== -1
        && vacante.ciclo_display.toLowerCase().indexOf(searchTerms.ciclo.toLowerCase()) !== -1
        && vacante.curso.toString().indexOf(searchTerms.curso) !== -1
        && vacante.num_vacantes_display.toString().indexOf(searchTerms.vacante.toLowerCase()) !== -1
        && vacante.num_alumnos.toString().indexOf(searchTerms.vacante.toLowerCase()) !== -1;
    };
    return filterFunction;
  }

  //  ON CHANGES - Subscripción a Cambios en Filtros de Tabla de Vacantes
  onChanges() {
    this.idVacanteFilter.valueChanges                                 //  id_vacante
    .subscribe(value => {
        this.filterValues.id_vacante = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteEntidadFilter.valueChanges                            //  entidad
    .subscribe(value => {
        this.filterValues.entidad_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteCicloFilter.valueChanges                              //  ciclo
    .subscribe(value => {
        this.filterValues.ciclo_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteCursoFilter.valueChanges                              //  curso
    .subscribe(value => {
        this.filterValues.curso = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteNumVacantesFilter.valueChanges                        //  num_vacantes
    .subscribe(value => {
        this.filterValues.num_vacantes_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteNumAlumnosFilter.valueChanges                         //  num_alumnos
    .subscribe(value => {
        this.filterValues.num_alumnos = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
  }

  //  CHANGE PAGE - Cambio de página Paginator
  changePage() {
    if (this.isCheckedAll) {
      this.isChecked = true;
    } else {
      this.isChecked = (((this.pageIndexChecked + 1) * this.pageSizeChecked) /
      ((this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize)) >= 1;
    }
  }

  // CHOOSE VACANTE - Selección de Vacante en Tabla de Vacantes
  chooseVacante(idVacante, event) {
    if (event.checked) {
      this.dataSource.filteredData.filter(vacante => {

          if (vacante.id_vacante === idVacante) {
            this.vacantesSelected.push(vacante);
            vacante.checked = true;
          }
      });
    } else {
      this.vacantesSelected = this.vacantesSelected.filter(vacante => {
        if (vacante.id_vacante === idVacante) {
          vacante.checked = false;
        }
        return idVacante !== vacante.id_vacante;
      });
    }
  }

  // CHOOSE ALL VACANTES - Selección de Todas las Vacantes en Tabla de Vacantes
  chooseAllVacantes(event) {
    this.isChecked = event.checked;

    const min = this.dataSource.paginator.pageSize * this.dataSource.paginator.pageIndex;
    const max = this.dataSource.paginator.pageSize * (this.dataSource.paginator.pageIndex + 1);

    let i = 0;
    if (event.checked) {

      this.pageIndexChecked = this.dataSource.paginator.pageIndex;
      this.pageSizeChecked = this.dataSource.paginator.pageSize;

      this.dataSource.filteredData.forEach(publicacion => {
        if ((i >= min && i < max)) {
          if (publicacion.checked !== true) {
            publicacion.checked = true;
            this.vacantesSelected.push(publicacion);
          }
        }
        i++;
      });

      if (this.vacantesSelected.length < this.dataSource.filteredData.length) {
        this.openSnackbarChooseAllVacantes();
      }
    } else {

      this.isCheckedAll = false;

      this.vacantesSelected = [];

      this.pageIndexChecked = 0;
      this.pageSizeChecked = 0;

      this.dataSource.filteredData.forEach(data => {
        data.checked = false;
      });
    }
  }

  // OPEN SNACKBAR CHOOSE ALL VACANTES - Apertura de Snackbar al Seleccionar todas las Vacantes en Tabla de Vacantes
  openSnackbarChooseAllVacantes() {
    const snackBarRef = this.snackBar.open(
      `Deseas Seleccionar los ${this.dataSource.filteredData.length} resultados`,
      'Seleccionar',
      { duration: 5000 }
    );
    snackBarRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        this.isCheckedAll = true;
        this.vacantesSelected = [];
        this.dataSource.filteredData.forEach(publicacion => {
          this.vacantesSelected.push(publicacion);
          publicacion.checked = true;
        });
      }
    });
  }
}
