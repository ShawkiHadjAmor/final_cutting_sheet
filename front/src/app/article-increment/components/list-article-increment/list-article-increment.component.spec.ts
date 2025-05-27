import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListArticleIncrementComponent } from './list-article-increment.component';

describe('ListArticleIncrementComponent', () => {
  let component: ListArticleIncrementComponent;
  let fixture: ComponentFixture<ListArticleIncrementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListArticleIncrementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListArticleIncrementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
