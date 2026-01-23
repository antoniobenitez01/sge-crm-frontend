export interface Alumno {
    id_alumno?: number;
    nif_nie: string;
    nombre: string;
    apellidos: string;
    fecha_nacimiento: string;
    entidad: number;
    ciclo: number;
    curso: number;
    vacante_asignada: number;
    telefono: string;
    direccion: string;
    cp: number;
    localidad: string;
    provincia: number;
    observaciones: string;

    checked?: boolean;
    entidad_display? : string;
    ciclo_display? : string;
    vacante_asignada_display? : string;
}
