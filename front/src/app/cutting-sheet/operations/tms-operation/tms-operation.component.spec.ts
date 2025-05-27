import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmsOperationComponent } from './tms-operation.component';

describe('TmsOperationComponent', () => {
  let component: TmsOperationComponent;
  let fixture: ComponentFixture<TmsOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TmsOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TmsOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
