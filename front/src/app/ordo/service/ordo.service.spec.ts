import { TestBed } from '@angular/core/testing';

import { OrdoService } from './ordo.service';

describe('OrdoService', () => {
  let service: OrdoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
