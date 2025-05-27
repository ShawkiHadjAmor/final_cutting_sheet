import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateEvolutionComponent } from './update-evolution.component';

describe('UpdateEvolutionComponent', () => {
  let component: UpdateEvolutionComponent;
  let fixture: ComponentFixture<UpdateEvolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateEvolutionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateEvolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
