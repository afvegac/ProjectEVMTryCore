import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NAME_MAX_LENGTH } from '../../common/column.constants';

export class CreateProjectDto {
  @ApiProperty({
    maxLength: NAME_MAX_LENGTH,
    example: 'Plataforma de Gestión Documental',
    description: 'Nombre del proyecto.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({
    example: 'Proyecto con desviación en costo y en cronograma.',
    description: 'Descripción libre del proyecto.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
