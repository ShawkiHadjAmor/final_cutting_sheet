import { TestBed } from '@angular/core/testing';

import { CuttingSheetEndpointsService } from './cutting-sheet-endpoints.service';

describe('CuttingSheetEndpointsService', () => {
  let service: CuttingSheetEndpointsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuttingSheetEndpointsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
