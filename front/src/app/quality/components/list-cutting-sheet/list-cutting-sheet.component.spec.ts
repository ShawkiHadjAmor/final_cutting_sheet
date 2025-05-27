import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCuttingSheetComponent } from './list-cutting-sheet.component';

describe('ListCuttingSheetComponent', () => {
  let component: ListCuttingSheetComponent;
  let fixture: ComponentFixture<ListCuttingSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListCuttingSheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCuttingSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
