import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarquageEtiquetteOperationComponent } from './marquage-etiquette-operation.component';


describe('MarquageEtiquetteOperationComponent', () => {
  let component: MarquageEtiquetteOperationComponent;
  let fixture: ComponentFixture<MarquageEtiquetteOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarquageEtiquetteOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarquageEtiquetteOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
