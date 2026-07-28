import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { EvmAnalysisService } from './evm-analysis.service';
import { EvmController } from './evm.controller';

@Module({
  imports: [ProjectsModule],
  controllers: [EvmController],
  providers: [EvmAnalysisService],
})
export class EvmModule {}
