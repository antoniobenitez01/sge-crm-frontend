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

  idVacanteFilter = new FormControl();
  vacanteEntidadFilter = new FormControl();
  vacanteCicloFilter = new FormControl();
  vacanteCursoFilter = new FormControl();
  vacanteNumVacantesFilter = new FormControl();
  vacanteNumAlumnosFilter = new FormControl();

  vacantesSelected: Vacante[] = [];

  isChecked = false;
  isCheckedAll = false;
  pageSizeChecked: number;
  pageIndexChecked: number;

  permises: Permises;

  selection: SelectionModel<Vacante>;
  vacante: Vacante;

  displayedColumns: string[];
  private filterValues = { id_vacante: '', entidad_display: '', ciclo_display: '', curso: '', num_vacantes_display: '', num_alumnos: '' };

  constructor(
      public dialog: MatDialog,
      private vacantesService : VacantesService,
      private alumnosService: AlumnosService,
      private entidadesService: EntidadesService,
      private ciclosService : CiclosService,
      private overlay: Overlay,
      private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.getVacantes();
  }

  async getVacantes() {
    const RESPONSE = await this.vacantesService.getAllVacantes().toPromise();
    this.permises = RESPONSE.permises;

    if (RESPONSE.ok) {

      const entidades = await this.getEntidades();
      const ciclos = await this.getCiclos();

      this.vacantesService.vacantes = await Promise.all(
        (RESPONSE.data as Vacante[]).map(async vacante => {
          let entidad = entidades.find(e => e.id_entidad === vacante.entidad);
          let ciclo = ciclos.find(c => c.id_ciclo === vacante.ciclo);
          let alumnos = await this.getAlumnosByVacanteId(vacante.id_vacante);
          return {
            ...vacante,
            entidad_display: entidad ? entidad.entidad : "Sin Entidad",
            ciclo_display: ciclo ? ciclo.ciclo : "Sin Ciclo",
            num_alumnos: alumnos.length,
            num_vacantes_display: vacante.num_vacantes - alumnos.length
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

  async addVacante() {
    const dialogRef = this.dialog.open(AddVacanteComponent, { scrollStrategy: this.overlay.scrollStrategies.noop(), disableClose: true });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  async deleteVacante(vacante: Vacante) {
    const dialogRef = this.dialog.open(DeleteVacanteComponent, { data: vacante, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  async editVacante(vacante: Vacante) {
    const dialogRef = this.dialog.open(EditVacanteComponent, { data: vacante, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  changePage() {
    if (this.isCheckedAll) {
      this.isChecked = true;
    } else {
      this.isChecked = (((this.pageIndexChecked + 1) * this.pageSizeChecked) /
      ((this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize)) >= 1;
    }
  }

  async getAlumnosByVacanteId(id_vacante : number){
    const RESPONSE = await this.alumnosService.getAlumnosByVacanteId(id_vacante).toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Alumno[];
    }
  }

  async getEntidades(){
    const RESPONSE = await this.entidadesService.getAllEntidades().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Entidad[];
    }
  }

  async getCiclos(){
    const RESPONSE = await this.ciclosService.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Ciclo[];
    }
  }

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

  onChanges() {
    this.idVacanteFilter.valueChanges
    .subscribe(value => {
        this.filterValues.id_vacante = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteEntidadFilter.valueChanges
    .subscribe(value => {
        this.filterValues.entidad_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteCicloFilter.valueChanges
    .subscribe(value => {
        this.filterValues.ciclo_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteCursoFilter.valueChanges
    .subscribe(value => {
        this.filterValues.curso = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteNumVacantesFilter.valueChanges
    .subscribe(value => {
        this.filterValues.num_vacantes_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.vacanteNumAlumnosFilter.valueChanges
    .subscribe(value => {
        this.filterValues.num_alumnos = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
  }

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

  chooseAllPublicacion(event) {
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
        this.openSnackbarChooseAllPublicacion();
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

  openSnackbarChooseAllPublicacion() {
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
