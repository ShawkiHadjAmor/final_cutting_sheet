import { TestBed } from '@angular/core/testing';

import { ArticleIncrementService } from './article-increment.service';

describe('ArticleIncrementService', () => {
  let service: ArticleIncrementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArticleIncrementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
