import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListEvolutionsComponent } from './list-evolutions.component';

describe('ListEvolutionsComponent', () => {
  let component: ListEvolutionsComponent;
  let fixture: ComponentFixture<ListEvolutionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListEvolutionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListEvolutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
