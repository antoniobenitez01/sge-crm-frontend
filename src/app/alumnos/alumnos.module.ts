import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CrudMaterialModule } from '../modules/crud-material/crud-material.module';
import { AlumnosComponent } from './alumnos.component';
import { AlumnosRoutingModule } from './entidades-routing.module';
import { AddAlumnoComponent } from './add-alumno/add-alumno.component';
import { DeleteAlumnoComponent } from './delete-alumno/delete-alumno.component';
import { DatosAlumnoModule } from './datos-alumno/datos-alumno.module';


@NgModule({
  declarations: [ AlumnosComponent, AddAlumnoComponent, DeleteAlumnoComponent ],
  imports: [
    CommonModule,
    AlumnosRoutingModule,
    CrudMaterialModule,
    DatosAlumnoModule
  ]
})
export class AlumnosModule { }
