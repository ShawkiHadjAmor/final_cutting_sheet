import { TestBed } from '@angular/core/testing';

import { SerialNumbersService } from './serial-numbers.service';

describe('SerialNumbersService', () => {
  let service: SerialNumbersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SerialNumbersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
