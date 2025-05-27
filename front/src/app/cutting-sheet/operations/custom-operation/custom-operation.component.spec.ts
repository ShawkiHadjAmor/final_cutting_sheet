import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomOperationComponent } from './custom-operation.component';

describe('CustomOperationComponent', () => {
  let component: CustomOperationComponent;
  let fixture: ComponentFixture<CustomOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
