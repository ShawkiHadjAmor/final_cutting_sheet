import { TestBed } from '@angular/core/testing';

import { CuttingSheetTemplateService } from './cutting-sheet-template.service';

describe('CuttingSheetTemplateService', () => {
  let service: CuttingSheetTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuttingSheetTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
