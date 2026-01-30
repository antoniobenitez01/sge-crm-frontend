import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE, ENTIDAD_VACANTE } from '../../shared/messages';
import { VacantesService } from 'src/app/services/vacantes.service';
import { Vacante } from 'src/app/shared/interfaces/vacante';

@Component({
  selector: 'app-delete-vacante',
  templateUrl: './delete-vacante.component.html',
})
export class DeleteVacanteComponent implements OnInit {
  VACANTE: String;

  constructor(
    public dialogRef: MatDialogRef<DeleteVacanteComponent>,
    @Inject(MAT_DIALOG_DATA) public vacante: Vacante,           //  DATOS - Vacante
    public servicioVacantes: VacantesService,                   //  SERVICIO - Vacantes
    public snackBar: MatSnackBar,
  )
  {   }

  ngOnInit(): void {
    this.VACANTE = ENTIDAD_VACANTE;
  }

  onNoClick(): void {
    this.dialogRef.close({ ok: false });
  }

  // CONFIRM DELETE - Proceso de Eliminación de Vacante
  async confirmDelete() {
    //  --- HTTP REQUEST : Delete Vacante
    const RESPONSE = await this.servicioVacantes.deleteVacante(this.vacante.id_vacante).toPromise();
    if (RESPONSE.ok) {
      this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 });
      this.dialogRef.close({ ok: RESPONSE.ok, data: RESPONSE.data });
    } else { this.snackBar.open(RESPONSE.message, CLOSE, { duration: 5000 }); }
  }
}
