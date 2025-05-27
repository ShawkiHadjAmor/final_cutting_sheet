import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEvolutionComponent } from './create-evolution.component';

describe('CreateEvolutionComponent', () => {
  let component: CreateEvolutionComponent;
  let fixture: ComponentFixture<CreateEvolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateEvolutionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEvolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
