import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../service/store.service';

interface Store {
  id: number;
  article: string;
  hasCuttingSheet: boolean;
  createdAt: string;
  preparationTime?: number;
  ordo: {
    id: number;
    orderNumber: string;
    quantity: number;
    article: string;
    date: string;
    programme: string;
    priority: boolean;
    createdAt: string;
  };
}

@Component({
  selector: 'app-list-of',
  templateUrl: './list-of.component.html',
  styleUrls: ['./list-of.component.css']
})
export class ListOfComponent implements OnInit {
  groupedArticles: {
    date: string;
    headers: string[];
    articlesWithCuttingSheet: Store[];
    articlesWithoutCuttingSheet: Store[];
  }[] = [];
  isLoading: boolean = false;
  messageModal: string | null = null;
  messageTitle: string = '';

  constructor(private storeService: StoreService) {}

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.isLoading = true;

    this.storeService.getAllStoresWithOrdos().subscribe({
      next: (stores: Store[]) => {
        console.log('Stores with ordos received:', stores);
        const groupedByDate = stores.reduce((acc: { [key: string]: { headers: string[]; articlesWithCuttingSheet: Store[]; articlesWithoutCuttingSheet: Store[] } }, store: Store) => {
          const ordo = store.ordo;
          if (!ordo || !ordo.createdAt) {
            console.warn('Store missing ordo or createdAt:', store);
            return acc;
          }
          const date = new Date(ordo.createdAt).toISOString().split('T')[0];
          const headers = ['orderNumber', 'quantity', 'article', 'date', 'programme', 'priority'];

          if (!acc[date]) {
            acc[date] = { headers, articlesWithCuttingSheet: [], articlesWithoutCuttingSheet: [] };
          }
          if (store.hasCuttingSheet) {
            acc[date].articlesWithCuttingSheet.push(store);
          } else {
            acc[date].articlesWithoutCuttingSheet.push(store);
          }
          return acc;
        }, {});

        this.groupedArticles = Object.keys(groupedByDate)
          .sort((a, b) => b.localeCompare(a))
          .map(date => ({
            date,
            headers: groupedByDate[date].headers,
            articlesWithCuttingSheet: groupedByDate[date].articlesWithCuttingSheet,
            articlesWithoutCuttingSheet: groupedByDate[date].articlesWithoutCuttingSheet
          }));

        console.log('Grouped Store articles:', this.groupedArticles);
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error fetching Store articles:', error);
        this.showMessageModal('Erreur lors du chargement', 'Erreur lors du chargement des articles Store: ' + error.message);
        this.groupedArticles = [];
        this.isLoading = false;
      }
    });
  }

  getTableCells(article: Store): string[] {
    const ordo = article.ordo;
    return [
      ordo.orderNumber,
      ordo.quantity.toString(),
      ordo.article,
      ordo.date,
      ordo.programme,
      ordo.priority ? 'Urgent' : 'Non Urgent' // Updated to display "Urgent" or "Non Urgent"
    ];
  }

  showMessageModal(title: string, message: string) {
    this.messageTitle = title;
    this.messageModal = message;
  }

  closeMessageModal() {
    this.messageModal = null;
    this.messageTitle = '';
  }
}