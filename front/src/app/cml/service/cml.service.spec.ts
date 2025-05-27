import { TestBed } from '@angular/core/testing';

import { CmlService } from './cml.service';

describe('CmlService', () => {
  let service: CmlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CmlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
