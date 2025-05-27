import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArticleIncrementRoutingModule } from './article-increment-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListArticleIncrementComponent } from './components/list-article-increment/list-article-increment.component';
import { CreateArticleIncrementComponent } from './components/create-article-increment/create-article-increment.component';


@NgModule({
  declarations: [
    ListArticleIncrementComponent,
    CreateArticleIncrementComponent,
  ],
  imports: [
    CommonModule,
    ArticleIncrementRoutingModule ,
        HttpClientModule,
            ReactiveFormsModule,
            FormsModule
    
  ]
})
export class ArticleIncrementModule { }
