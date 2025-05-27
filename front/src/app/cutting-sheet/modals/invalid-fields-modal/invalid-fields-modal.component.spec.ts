import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidFieldsModalComponent } from './invalid-fields-modal.component';

describe('InvalidFieldsModalComponent', () => {
  let component: InvalidFieldsModalComponent;
  let fixture: ComponentFixture<InvalidFieldsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvalidFieldsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvalidFieldsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
