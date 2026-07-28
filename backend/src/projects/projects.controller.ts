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
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponse } from './dto/project.response';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

/**
 * El controlador solo traduce entre HTTP y el servicio: valida la entrada mediante los DTO, delega y
 * convierte el resultado al contrato público. No contiene lógica de negocio.
 */
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(await this.projectsService.create(dto));
  }

  @Get()
  async findAll(): Promise<ProjectResponse[]> {
    const projects = await this.projectsService.findAll();

    return projects.map((project) => ProjectResponse.fromEntity(project));
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(await this.projectsService.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return ProjectResponse.fromEntity(
      await this.projectsService.update(id, dto),
    );
  }

  /** Elimina el proyecto y, en cascada, sus actividades. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }
}
