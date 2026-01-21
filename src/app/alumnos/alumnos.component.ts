import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Alumno } from '../shared/interfaces/alumno';
import { FormControl } from '@angular/forms';
import { Permises } from '../shared/interfaces/api-response';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { ProvinciasService } from '../services/provincias.service';
import { EntidadesService } from '../services/entidades.service';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlumnosService } from '../services/alumnos.service';
import { VacantesService } from '../services/vacantes.service';
import { Provincia } from '../shared/interfaces/provincia';
import { Entidad } from '../shared/interfaces/entidad';
import { CiclosService } from '../services/ciclos.service';
import { Ciclo } from '../shared/interfaces/ciclo';
import { DatosAlumnoComponent } from './datos-alumno/datos-alumno.component';
import { AddAlumnoComponent } from './add-alumno/add-alumno.component';
import { DeleteAlumnoComponent } from './delete-alumno/delete-alumno.component';

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.scss']
})
export class AlumnosComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: MatTableDataSource<Alumno> = new MatTableDataSource();

  idAlumnoFilter = new FormControl();
  alumnoNifFilter = new FormControl();
  alumnoNombreFilter = new FormControl();
  alumnoApellidosFilter = new FormControl();
  alumnoFechaFilter = new FormControl();
  alumnoEntidadFilter = new FormControl();
  alumnoCicloFilter = new FormControl();
  alumnoCursoFilter = new FormControl();
  alumnoVacanteFilter = new FormControl();

  alumnosSelected: Alumno[] = [];

  isChecked = false;
  isCheckedAll = false;
  pageSizeChecked: number;
  pageIndexChecked: number;

  permises: Permises;

  selection: SelectionModel<Alumno>;
  alumno: Alumno;

  displayedColumns: string[];
  private filterValues = { id_alumno: '', nif_nie: '',nombre: '', apellidos: '', fecha_nacimiento: '', entidad: '', ciclo: '', curso: '', vacante_asignada: '' };

  constructor(
      public dialog: MatDialog,
      private alumnosService: AlumnosService,
      private entidadesService: EntidadesService,
      private ciclosService : CiclosService,
      private provinciaService: ProvinciasService,
      private overlay: Overlay,
      private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.getAlumnos();
  }

  async getAlumnos() {
    const RESPONSE = await this.alumnosService.getAllAlumnos().toPromise();
    this.permises = RESPONSE.permises;

    if (RESPONSE.ok) {
      this.alumnosService.alumnos = (RESPONSE.data as Alumno[])
      .map(alumno => ({
        ...alumno,
        vacante_asignada : alumno.vacante_asignada == null ? "Sin Vacante" : alumno.vacante_asignada
      }));
      this.displayedColumns = ['id_alumno', 'nif_nie', 'nombre', 'apellidos', 'fecha_nacimiento', 'entidad', 'ciclo', 'curso', 'vacante_asignada', 'actions'];
      this.dataSource.data = this.alumnosService.alumnos || [];
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = this.createFilter();
      this.selection = new SelectionModel<Alumno>(false, [this.alumno]);

      this.onChanges();
    }
  }

  async addAlumno() {
    const dialogRef = this.dialog.open(AddAlumnoComponent, { scrollStrategy: this.overlay.scrollStrategies.noop(), disableClose: true });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  async deleteAlumno(alumno: Alumno) {
    const dialogRef = this.dialog.open(DeleteAlumnoComponent, { data: alumno, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  async datosAlumno(alummo: Alumno) {
    const ALUMNO = alummo;
    const ENTIDAD = await this.getEntidades();
    const CICLO = await this.getCiclos();
    const PROVINCIA = await this.getProvincias();

    if (ALUMNO) {
      const dialogRef = this.dialog.open(DatosAlumnoComponent, {
        width: '70em',
        maxWidth: '70em',
        scrollStrategy: this.overlay.scrollStrategies.noop(),
        disableClose: true,
        data: {
          alumno: ALUMNO,
          entidad : ENTIDAD,
          ciclo : CICLO,
          provincias: PROVINCIA,
        }
      });

      const RESULT = await dialogRef.afterClosed().toPromise();
      await this.getEntidades();
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

  async getProvincias(){
    const RESPONSE = await this.provinciaService.getAllProvincias().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Provincia[];
    }
  }

  createFilter(): (alumno: Alumno, filter: string) => boolean {
    const filterFunction = (alumno: Alumno, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      return alumno.id_alumno.toString().indexOf(searchTerms.id_alumno) !== -1
        && alumno.nif_nie.toLowerCase().indexOf(searchTerms.nif_nie.toLowerCase()) !== -1
        && alumno.nombre.toLowerCase().indexOf(searchTerms.nombre.toLowerCase()) !== -1
        && alumno.apellidos.toLowerCase().indexOf(searchTerms.apellidos.toLowerCase()) !== -1
        && alumno.fecha_nacimiento.toString().toLowerCase().indexOf(searchTerms.fecha_nacimiento.toLowerCase()) !== -1
        && alumno.entidad.toLowerCase().indexOf(searchTerms.fk_entidad.toLowerCase()) !== -1
        && alumno.ciclo.toLowerCase().indexOf(searchTerms.fk_ciclo.toLowerCase()) !== -1
        && alumno.curso.toString().indexOf(searchTerms.curso) !== -1
        && alumno.vacante_asignada.toLowerCase().indexOf(searchTerms.fk_vacante.toLowerCase()) !== -1
        ;
    };
    return filterFunction;
  }

  onChanges() {
    this.idAlumnoFilter.valueChanges
    .subscribe(value => {
        this.filterValues.id_alumno = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoNifFilter.valueChanges
    .subscribe(value => {
        this.filterValues.nif_nie = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoNombreFilter.valueChanges
    .subscribe(value => {
        this.filterValues.nombre = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoApellidosFilter.valueChanges
    .subscribe(value => {
        this.filterValues.apellidos = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoFechaFilter.valueChanges
    .subscribe(value => {
        this.filterValues.fecha_nacimiento = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoEntidadFilter.valueChanges
    .subscribe(value => {
        this.filterValues.entidad = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoCicloFilter.valueChanges
    .subscribe(value => {
        this.filterValues.ciclo = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoCursoFilter.valueChanges
    .subscribe(value => {
        this.filterValues.curso = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoVacanteFilter.valueChanges
    .subscribe(value => {
        this.filterValues.vacante_asignada = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
  }

  chooseEntidad(idAlumno, event) {

    if (event.checked) {
      this.dataSource.filteredData.filter(alumno => {

          if (alumno.id_alumno === idAlumno) {
            this.alumnosSelected.push(alumno);
            alumno.checked = true;
          }
      });
    } else {
      this.alumnosSelected = this.alumnosSelected.filter(alumno => {
        if (alumno.id_alumno === idAlumno) {
          alumno.checked = false;
        }
        return idAlumno !== alumno.id_alumno;
      });
    }

    //console.log(this.entidadesSelected);
  }

  chooseAllPublicacion(event) {
    this.isChecked = event.checked;
    this.alumnosSelected = this.alumnosSelected; ///?????????????

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
            this.alumnosSelected.push(publicacion);
          }
        }
        i++;
      });

      if (this.alumnosSelected.length < this.dataSource.filteredData.length) {
        this.openSnackbarChooseAllPublicacion();
      }
    } else {

      this.isCheckedAll = false;

      this.alumnosSelected = [];

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
        this.alumnosSelected = [];
        this.dataSource.filteredData.forEach(publicacion => {
          this.alumnosSelected.push(publicacion);
          publicacion.checked = true;
        });
      }
    });
  }
}
