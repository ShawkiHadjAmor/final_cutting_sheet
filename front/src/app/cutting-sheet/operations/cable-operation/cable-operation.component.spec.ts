import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CableOperationComponent } from './cable-operation.component';

describe('CableOperationComponent', () => {
  let component: CableOperationComponent;
  let fixture: ComponentFixture<CableOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CableOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CableOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
