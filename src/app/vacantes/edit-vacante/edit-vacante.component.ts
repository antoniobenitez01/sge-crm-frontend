import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Entidad } from 'src/app/shared/interfaces/entidad';
import { EntidadesService } from 'src/app/services/entidades.service';
import { CLOSE, INVALID_FORM, ENTIDAD_VACANTE } from '../../shared/messages';
import { Ciclo } from 'src/app/shared/interfaces/ciclo';
import { CiclosService } from 'src/app/services/ciclos.service';
import { Vacante } from 'src/app/shared/interfaces/vacante';
import { VacantesService } from 'src/app/services/vacantes.service';

@Component({
  selector: 'app-edit-vacante',
  templateUrl: './edit-vacante.component.html',
  styleUrls: ['./edit-vacante.component.scss']
})
export class EditVacanteComponent implements OnInit {
  vacanteForm: FormGroup;

  entidades : Entidad[];
  ciclos: Ciclo[];

  VACANTE: String;

  constructor(public dialogRef: MatDialogRef<EditVacanteComponent>,
    @Inject(MAT_DIALOG_DATA) public vacante: Vacante,
    private snackBar: MatSnackBar,
    private servicioVacantes: VacantesService,
    private servicioEntidad: EntidadesService,
    private servicioCiclo : CiclosService,

  ){ }

  ngOnInit(): void {
    this.vacanteForm = new FormGroup({
      entidad: new FormControl(this.vacante?.entidad || '', { validators: Validators.required }),
      ciclo: new FormControl(this.vacante?.ciclo || '', { validators: Validators.required }),
      curso: new FormControl(this.vacante?.curso || '', { validators: Validators.required }),
      observaciones: new FormControl(this.vacante?.observaciones || '')
    });

    this.VACANTE = ENTIDAD_VACANTE;
    this.getEntidades();
    this.getCiclos();

  }

  async confirmEdit() {
    if (this.vacanteForm.valid) {
      const vacante = this.vacanteForm.value as Vacante;

      const RESPONSE = await this.servicioVacantes.editVacante(vacante).toPromise();
      if (RESPONSE.ok) {
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
      this.entidades = (RESPONSE.data as Entidad[]).filter(entidad => entidad.id_tipo_entidad === 1);
    }
  }

  async getCiclos(){
    const RESPONSE = await this.servicioCiclo.getAllCiclos().toPromise();
    if (RESPONSE.ok){
      this.ciclos = RESPONSE.data as Ciclo[];
    }
  }

  onNoClick() {
    this.dialogRef.close({ok: false});
  }
}
