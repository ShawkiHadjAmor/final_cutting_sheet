import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateArticleIncrementComponent } from './create-article-increment.component';

describe('CreateArticleIncrementComponent', () => {
  let component: CreateArticleIncrementComponent;
  let fixture: ComponentFixture<CreateArticleIncrementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateArticleIncrementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateArticleIncrementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
