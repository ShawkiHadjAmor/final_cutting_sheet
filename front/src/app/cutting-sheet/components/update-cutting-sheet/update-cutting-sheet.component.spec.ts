import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCuttingSheetComponent } from './update-cutting-sheet.component';

describe('UpdateCuttingSheetComponent', () => {
  let component: UpdateCuttingSheetComponent;
  let fixture: ComponentFixture<UpdateCuttingSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateCuttingSheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateCuttingSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
