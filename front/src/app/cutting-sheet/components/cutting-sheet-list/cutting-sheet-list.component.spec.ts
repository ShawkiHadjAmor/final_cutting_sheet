import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuttingSheetListComponent } from './cutting-sheet-list.component';

describe('CuttingSheetListComponent', () => {
  let component: CuttingSheetListComponent;
  let fixture: ComponentFixture<CuttingSheetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CuttingSheetListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CuttingSheetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
