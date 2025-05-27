import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoupeCableDansUapComponent } from './coupe-cable-dans-uap.component';

describe('CoupeCableDansUapComponent', () => {
  let component: CoupeCableDansUapComponent;
  let fixture: ComponentFixture<CoupeCableDansUapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoupeCableDansUapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoupeCableDansUapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
