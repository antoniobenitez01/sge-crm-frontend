import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CrudMaterialModule } from '../modules/crud-material/crud-material.module';
import { AlumnosComponent } from './alumnos.component';
import { AlumnosRoutingModule } from './alumnos-routing.module';
import { AddAlumnoComponent } from './add-alumno/add-alumno.component';
import { DeleteAlumnoComponent } from './delete-alumno/delete-alumno.component';
import { EditAlumnoComponent } from './edit-alumno/edit-alumno.component';


@NgModule({
  declarations: [ AlumnosComponent, AddAlumnoComponent, DeleteAlumnoComponent, EditAlumnoComponent ],
  imports: [
    CommonModule,
    AlumnosRoutingModule,
    CrudMaterialModule,
  ]
})
export class AlumnosModule { }
