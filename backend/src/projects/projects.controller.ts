import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiIdentifiedResourceErrors,
  ApiValidationErrors,
} from '../common/decorators/api-error-responses.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponse } from './dto/project.response';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

const PROJECT_NOT_FOUND = 'No existe un proyecto con ese identificador.';

/**
 * El controlador solo traduce entre HTTP y el servicio: valida la entrada mediante los DTO, delega y
 * convierte el resultado al contrato público. No contiene lógica de negocio.
 */
@ApiTags('Proyectos')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un proyecto' })
  @ApiCreatedResponse({ type: ProjectResponse })
  @ApiValidationErrors()
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(await this.projectsService.create(dto));
  }

  @Get()
  @ApiOperation({
    summary: 'Listar los proyectos, del más antiguo al más reciente',
  })
  @ApiOkResponse({ type: [ProjectResponse] })
  async findAll(): Promise<ProjectResponse[]> {
    const projects = await this.projectsService.findAll();

    return projects.map((project) => ProjectResponse.fromEntity(project));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un proyecto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponse })
  @ApiIdentifiedResourceErrors(PROJECT_NOT_FOUND)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(await this.projectsService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar un proyecto',
    description: 'Solo se modifican los campos incluidos en la petición.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponse })
  @ApiIdentifiedResourceErrors(PROJECT_NOT_FOUND)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(
      await this.projectsService.update(id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un proyecto',
    description: 'Elimina en cascada todas sus actividades.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Proyecto eliminado.' })
  @ApiIdentifiedResourceErrors(PROJECT_NOT_FOUND)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }
}
