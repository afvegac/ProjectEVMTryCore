import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NAME_MAX_LENGTH } from '../../common/column.constants';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
