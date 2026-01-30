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
import { Provincia } from '../shared/interfaces/provincia';
import { Entidad } from '../shared/interfaces/entidad';
import { CiclosService } from '../services/ciclos.service';
import { Ciclo } from '../shared/interfaces/ciclo';
import { AddAlumnoComponent } from './add-alumno/add-alumno.component';
import { DeleteAlumnoComponent } from './delete-alumno/delete-alumno.component';
import { EditAlumnoComponent } from './edit-alumno/edit-alumno.component';
import { VacantesService } from '../services/vacantes.service';
import { Vacante } from '../shared/interfaces/vacante';

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.scss']
})
export class AlumnosComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: MatTableDataSource<Alumno> = new MatTableDataSource();

  //  VARIABLES DE FILTRO
  idAlumnoFilter = new FormControl();                 //  id_alumno
  alumnoNifFilter = new FormControl();                //  nif_nie
  alumnoNombreFilter = new FormControl();             //  nombre
  alumnoApellidosFilter = new FormControl();          //  apellidos
  alumnoFechaFilter = new FormControl();              //  fecha_nacimiento
  alumnoEntidadFilter = new FormControl();            //  entidad
  alumnoCicloFilter = new FormControl();              //  ciclo
  alumnoCursoFilter = new FormControl();              //  curso
  alumnoVacanteFilter = new FormControl();            //  vacante_asignada

  //  VARIABLES DE SELECCIÓN
  alumnosSelected: Alumno[] = [];
  selection: SelectionModel<Alumno>;

  //  VARIABLES PAGINATOR
  isChecked = false;
  isCheckedAll = false;
  pageSizeChecked: number;
  pageIndexChecked: number;

  //  VARIABLES DATOS Y PERMISOS
  alumno: Alumno;
  permises: Permises;

  displayedColumns: string[];
  private filterValues = { id_alumno: '', nif_nie: '',nombre: '', apellidos: '', fecha_nacimiento: '', entidad_display: '', ciclo_display: '', curso: '', vacante_asignada: '' };

  constructor(
      public dialog: MatDialog,
      private alumnosService: AlumnosService,         //  SERVICIO - Alumnos
      private vacantesService: VacantesService,       //  SERVICIO - Vacantes
      private entidadesService: EntidadesService,     //  SERVICIO - Entidades
      private ciclosService : CiclosService,          //  SERVICIO - Ciclos
      private provinciaService: ProvinciasService,    //  SERVICIO - Provincias
      private overlay: Overlay,
      private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.getAlumnos();
  }

  //  GET ALUMNOS - Recogida de Alumnos en BBDD y ajuste de objeto para visualización en tabla
  async getAlumnos() {
    const RESPONSE = await this.alumnosService.getAllAlumnos().toPromise();
    this.permises = RESPONSE.permises;

    if (RESPONSE.ok) {

      const entidades = await this.getEntidades();                                        //  Recogida de Entidades en BBDD
      const ciclos = await this.getCiclos();                                              //  Recogida de Ciclos en BBDD

      this.alumnosService.alumnos = await Promise.all((RESPONSE.data as Alumno[])
      .map(async alumno => {

        let entidad = entidades.find(e => e.id_entidad === alumno.entidad);               //  Búsqueda de Entidad con misma id_entidad
        let ciclo = ciclos.find(c => c.id_ciclo === alumno.ciclo);                        //  Búsqueda de Ciclo con mismo id_ciclo
        let vacante = await this.getVacanteByAlumnoId(alumno.id_alumno);                  //  Búsqueda de Vacante asignada a Alumno

        let vacanteAsignada = "Sin Vacante";
        //  (Si Alumno tuviese Vacante asignada) - Búsqueda de Nombre de Entidad de Vacante asignada a Alumno
        if(vacante){
          let vacanteEntidad = entidades.find(ent => ent.id_entidad === vacante.entidad)
          vacanteAsignada = vacanteEntidad ? vacanteEntidad.entidad : "Sin Entidad";
        }

        return {
          //  Asignación de Valores para Visualización en Tabla de Alumnos
          ...alumno,
          entidad_display : entidad ? entidad.entidad : "Sin Entidad",                    //  Nombre de Entidad -> entidad_display
          ciclo_display : ciclo ? ciclo.cod_ciclo : "Sin Ciclo",                          //  Nombre de Ciclo -> ciclo_displ
          vacante_asignada : vacanteAsignada                                              //  Nombre en Entidad en Vacante Asignada
        };

      }));

      this.displayedColumns = ['id_alumno', 'nif_nie', 'nombre', 'apellidos', 'fecha_nacimiento', 'entidad_display', 'ciclo_display', 'curso', 'vacante_asignada', 'actions'];
      this.dataSource.data = this.alumnosService.alumnos || [];
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = this.createFilter();
      this.selection = new SelectionModel<Alumno>(false, [this.alumno]);

      this.onChanges();
    }
  }

  //  ADD ALUMNO -  Apertura de Dialog 'AddAlumnoComponent'
  async addAlumno() {
    const dialogRef = this.dialog.open(AddAlumnoComponent, { scrollStrategy: this.overlay.scrollStrategies.noop(), disableClose: true });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  DELETE ALUMNO - Apertura de Dialog 'DeleteAlumnoComponent' con datos de Alumno
  async deleteAlumno(alumno: Alumno) {
    const dialogRef = this.dialog.open(DeleteAlumnoComponent, { data: alumno, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  EDIT ALUMNO - Apertura de Dialog 'EditAlumnoComponent' con datos de Alumno
  async editAlumno(alumno: Alumno) {
    const dialogRef = this.dialog.open(EditAlumnoComponent, { data: alumno, scrollStrategy: this.overlay.scrollStrategies.noop() });
    const RESULT = await dialogRef.afterClosed().toPromise();
    if (RESULT) {
      if (RESULT.ok) {
        this.ngOnInit();
      }
    }
  }

  //  GET VACANTE BY ALUMNO ID - Recogida de Vacante en BBDD asignados a un Alumno con id_alumno
  async getVacanteByAlumnoId(id_alumno : number){
    const RESPONSE = await this.vacantesService.getVacanteByAlumnoId(id_alumno).toPromise();
    if(RESPONSE.ok){
      return RESPONSE.data as Vacante;
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

  //  GET PROVINCIAS - Recogida de Provincias en BBDD
  async getProvincias(){
    const RESPONSE = await this.provinciaService.getAllProvincias().toPromise();
    if (RESPONSE.ok){
      return RESPONSE.data as Provincia[];
    }
  }

  // CREATE FILTER - Creación de Filtros de Tabla de Alumnos
  createFilter(): (alumno: Alumno, filter: string) => boolean {
    const filterFunction = (alumno: Alumno, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      return alumno.id_alumno.toString().indexOf(searchTerms.id_alumno) !== -1
        && alumno.nif_nie.toLowerCase().indexOf(searchTerms.nif_nie.toLowerCase()) !== -1
        && alumno.nombre.toLowerCase().indexOf(searchTerms.nombre.toLowerCase()) !== -1
        && alumno.apellidos.toLowerCase().indexOf(searchTerms.apellidos.toLowerCase()) !== -1
        && alumno.fecha_nacimiento.toString().toLowerCase().indexOf(searchTerms.fecha_nacimiento.toLowerCase()) !== -1
        && alumno.entidad_display.toLowerCase().indexOf(searchTerms.entidad.toLowerCase()) !== -1
        && alumno.ciclo_display.toLowerCase().indexOf(searchTerms.ciclo.toLowerCase()) !== -1
        && alumno.curso.toString().indexOf(searchTerms.curso) !== -1
        && alumno.vacante_asignada.toLowerCase().indexOf(searchTerms.vacante.toLowerCase()) !== -1
        ;
    };
    return filterFunction;
  }

  //  ON CHANGES - Subscripción a Cambios en Filtros de Tabla de Alumnos
  onChanges() {
    this.idAlumnoFilter.valueChanges                                  //  id_alumno
    .subscribe(value => {
        this.filterValues.id_alumno = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoNifFilter.valueChanges                                 //  nif_nie
    .subscribe(value => {
        this.filterValues.nif_nie = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoNombreFilter.valueChanges                              //  nombre
    .subscribe(value => {
        this.filterValues.nombre = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoApellidosFilter.valueChanges                           //  apellidos
    .subscribe(value => {
        this.filterValues.apellidos = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoFechaFilter.valueChanges                               //  fecha
    .subscribe(value => {
        this.filterValues.fecha_nacimiento = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoEntidadFilter.valueChanges                             //  entidad
    .subscribe(value => {
        this.filterValues.entidad_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoCicloFilter.valueChanges                               //  ciclo
    .subscribe(value => {
        this.filterValues.ciclo_display = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoCursoFilter.valueChanges                               //  curso
    .subscribe(value => {
        this.filterValues.curso = value;
        this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.alumnoVacanteFilter.valueChanges                             //  vacante
    .subscribe(value => {
        this.filterValues.vacante_asignada = value;
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

  // CHOOSE ALUMNO - Selección de Alumno en Tabla de Vacantes
  chooseAlumno(idAlumno, event) {
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
  }

  // CHOOSE ALL ALUMNOS - Selección de Todas las Alumnos en Tabla de Vacantes
  chooseAllAlumnos(event) {
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
            this.alumnosSelected.push(publicacion);
          }
        }
        i++;
      });

      if (this.alumnosSelected.length < this.dataSource.filteredData.length) {
        this.openSnackbarChooseAllAlumnos();
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

  // OPEN SNACKBAR CHOOSE ALL ALUMNOS - Apertura de Snackbar al Seleccionar todas las Alumnos en Tabla de Alumnos
  openSnackbarChooseAllAlumnos() {
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
