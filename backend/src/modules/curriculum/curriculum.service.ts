import { Injectable } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';

@Injectable()
export class CurriculumService {
  constructor(private readonly repo: CurriculumRepository) {}
  tree() { return this.repo.findUnitsWithSubUnits(); }
}
