export interface Alumno {
    id_alumno?: number;
    nif_nie: string;
    nombre: string;
    apellidos: string;
    fecha_nacimiento: string;
    entidad: string;
    ciclo: string;
    curso: number;
    vacante_asignada: string;
    telefono: string;
    direccion: string;
    cp: number;
    localidad: string;
    provincia: string;
    observaciones: string;

    checked?: boolean;
}
