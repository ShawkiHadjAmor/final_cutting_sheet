import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonchonOperationComponent } from './monchon-operation.component';

describe('MonchonOperationComponent', () => {
  let component: MonchonOperationComponent;
  let fixture: ComponentFixture<MonchonOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonchonOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonchonOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
