import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarquageLaserOperationComponent } from './marquage-laser-operation.component';

describe('MarquageLaserOperationComponent', () => {
  let component: MarquageLaserOperationComponent;
  let fixture: ComponentFixture<MarquageLaserOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarquageLaserOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarquageLaserOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
