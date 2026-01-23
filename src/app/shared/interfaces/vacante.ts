export interface Vacante {
    id_vacante?: number;
    entidad : number;
    ciclo : number;
    curso : number;
    num_vacantes : number;
    observaciones : number;

    checked?: boolean;
    entidad_display? : string;
    ciclo_display? : string;
    num_alumnos : number;
}
