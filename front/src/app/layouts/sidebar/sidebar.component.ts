import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/authentification/service/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCuttingSheetExpanded = false;
  isProgramExpanded = false;
  isArticleIncrementExpanded = false;
  isEvolutionsExpanded = false;
  isQualityEvolutionsExpanded = false;
  isOrdoEvolutionsExpanded = false;
  @Input() isSidebarOpen = false;
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleSubmenu(menu: string): void {
    if (menu === 'cuttingSheet') {
      this.isCuttingSheetExpanded = !this.isCuttingSheetExpanded;
      this.isProgramExpanded = false;
      this.isArticleIncrementExpanded = false;
      this.isEvolutionsExpanded = false;
      this.isQualityEvolutionsExpanded = false;
      this.isOrdoEvolutionsExpanded = false;
    } else if (menu === 'program') {
      this.isProgramExpanded = !this.isProgramExpanded;
      this.isCuttingSheetExpanded = false;
      this.isArticleIncrementExpanded = false;
      this.isEvolutionsExpanded = false;
      this.isQualityEvolutionsExpanded = false;
      this.isOrdoEvolutionsExpanded = false;
    } else if (menu === 'articleIncrement') {
      this.isArticleIncrementExpanded = !this.isArticleIncrementExpanded;
      this.isCuttingSheetExpanded = false;
      this.isProgramExpanded = false;
      this.isEvolutionsExpanded = false;
      this.isQualityEvolutionsExpanded = false;
      this.isOrdoEvolutionsExpanded = false;
    } else if (menu === 'evolutions') {
      this.isEvolutionsExpanded = !this.isEvolutionsExpanded;
      this.isCuttingSheetExpanded = false;
      this.isProgramExpanded = false;
      this.isArticleIncrementExpanded = false;
      this.isQualityEvolutionsExpanded = false;
      this.isOrdoEvolutionsExpanded = false;
    } else if (menu === 'qualityEvolutions') {
      this.isQualityEvolutionsExpanded = !this.isQualityEvolutionsExpanded;
      this.isCuttingSheetExpanded = false;
      this.isProgramExpanded = false;
      this.isArticleIncrementExpanded = false;
      this.isEvolutionsExpanded = false;
      this.isOrdoEvolutionsExpanded = false;
    } else if (menu === 'ordoEvolutions') {
      this.isOrdoEvolutionsExpanded = !this.isOrdoEvolutionsExpanded;
      this.isCuttingSheetExpanded = false;
      this.isProgramExpanded = false;
      this.isArticleIncrementExpanded = false;
      this.isEvolutionsExpanded = false;
      this.isQualityEvolutionsExpanded = false;
    }
  }

  hasRole(role: string): boolean {
    return this.userRole !== null && this.authService.hasRole(role);
  }
}