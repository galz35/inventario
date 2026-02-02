import { IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CrearOTDto {
  @IsNotEmpty()
  @IsNumber()
  idProyecto: number;

  @IsNotEmpty()
  @IsNumber()
  idCliente: number;

  @IsNotEmpty()
  @IsNumber()
  idTipoOT: number;

  @IsOptional()
  @IsNumber()
  idTecnico?: number;

  @IsNotEmpty()
  @IsString()
  direccion: string;

  @IsOptional()
  @IsString()
  prioridad?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  numeroCliente?: string;

  @IsOptional()
  @IsString()
  contactoNombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  correo?: string;

  @IsOptional()
  @IsString()
  descripcionTrabajo?: string;

  @IsOptional()
  @IsString()
  clienteNombre?: string;
}

export class AsignarTecnicoDto {
  @IsNotEmpty()
  @IsNumber()
  idOT: number;

  @IsNotEmpty()
  @IsNumber()
  idTecnico: number;

  @IsNotEmpty()
  @IsNumber()
  idUsuarioAsigna: number;
}
