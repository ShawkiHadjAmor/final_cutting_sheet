import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCuttingSheetComponent } from './create-cutting-sheet.component';

describe('CreateCuttingSheetComponent', () => {
  let component: CreateCuttingSheetComponent;
  let fixture: ComponentFixture<CreateCuttingSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateCuttingSheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCuttingSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
