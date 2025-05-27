import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarquageLaserTmsOperationComponent } from './marquage-laser-tms.component';

describe('MarquageLaserTmsComponent', () => {
  let component: MarquageLaserTmsOperationComponent;
  let fixture: ComponentFixture<MarquageLaserTmsOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarquageLaserTmsOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarquageLaserTmsOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
