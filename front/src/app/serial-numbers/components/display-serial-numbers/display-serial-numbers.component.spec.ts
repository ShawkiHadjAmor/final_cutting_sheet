import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplaySerialNumbersComponent } from './display-serial-numbers.component';

describe('DisplaySerialNumbersComponent', () => {
  let component: DisplaySerialNumbersComponent;
  let fixture: ComponentFixture<DisplaySerialNumbersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplaySerialNumbersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplaySerialNumbersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
