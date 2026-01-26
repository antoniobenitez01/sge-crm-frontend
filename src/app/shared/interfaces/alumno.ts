export interface Alumno {
    id_alumno?: number;
    nif_nie: string;
    nombre: string;
    apellidos: string;
    fecha_nacimiento: string;
    entidad: number;
    ciclo: number;
    curso: number;
    telefono: string;
    direccion: string;
    cp: number;
    localidad: string;
    provincia: number;
    observaciones: string;

    checked?: boolean;
    entidad_display? : string;
    vacante_asignada? : string;
    ciclo_display? : string;
}
