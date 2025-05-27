import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KittingCablageOperationComponent } from './kitting-cablage-operation.component';

describe('KittingCablageOperationComponent', () => {
  let component: KittingCablageOperationComponent;
  let fixture: ComponentFixture<KittingCablageOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KittingCablageOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KittingCablageOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
