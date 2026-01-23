import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CrudMaterialModule } from '../modules/crud-material/crud-material.module';
import { VacantesComponent } from './vacantes.component';
import { VacantesRoutingModule } from './vacantes-routing.module';
import { AddVacanteComponent } from './add-vacante/add-vacante.component';
import { DeleteVacanteComponent } from './delete-vacante/delete-vacante.component';
import { EditVacanteComponent } from './edit-vacante/edit-vacante.component';


@NgModule({
  declarations: [ VacantesComponent, AddVacanteComponent, DeleteVacanteComponent, EditVacanteComponent ],
  imports: [
    CommonModule,
    VacantesRoutingModule,
    CrudMaterialModule,
  ]
})
export class VacantesModule { }
