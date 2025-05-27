import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThermoOperationComponent } from './thermo-operation.component';

describe('ThermoOperationComponent', () => {
  let component: ThermoOperationComponent;
  let fixture: ComponentFixture<ThermoOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThermoOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThermoOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
