import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Evolution } from 'src/app/evolution/service/evolution.service';
import { AuthService } from 'src/app/authentification/service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private stompClient: Client | null = null;
  private evolutionSubject = new Subject<Evolution>();
  private qualitySubject = new Subject<Evolution>();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.stompClient?.active || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const socketUrl = `${environment.baseUrl}/ws`;
    const token = this.authService.tokenSubject.value;

    console.log('WebSocket URL:', socketUrl);
    console.log('JWT Token:', token ? 'Present' : 'Absent');
    console.log('Authenticated:', this.authService.isAuthenticated());

    try {
      const socket = new SockJS(socketUrl);
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: (str) => console.log('STOMP: ' + str),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {}
      });

      this.stompClient.onConnect = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        console.log('WebSocket connected successfully. Subscribing to topics...');

        this.stompClient?.subscribe('/topic/evolution-notifications', (message: IMessage) => {
          try {
            const evolution = JSON.parse(message.body);
            console.log('Received evolution notification:', evolution);
            this.evolutionSubject.next(evolution);
          } catch (e) {
            console.error('Error parsing evolution notification:', e);
          }
        });

        this.stompClient?.subscribe('/topic/quality-notifications', (message: IMessage) => {
          try {
            const evolution = JSON.parse(message.body);
            console.log('Received quality notification:', evolution);
            this.qualitySubject.next(evolution);
          } catch (e) {
            console.error('Error parsing quality notification:', e);
          }
        });
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        console.error('Error details:', JSON.stringify(frame, null, 2));
        this.handleDisconnect();
      };

      this.stompClient.onWebSocketError = (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect();
      };

      this.stompClient.onWebSocketClose = () => {
        console.log('WebSocket disconnected');
        this.handleDisconnect();
      };

      this.stompClient.activate();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    this.isConnecting = false;
    this.stompClient = null;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), 5000);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  getEvolutionNotifications(): Observable<Evolution> {
    return this.evolutionSubject.asObservable();
  }

  getQualityNotifications(): Observable<Evolution> {
    return this.qualitySubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('WebSocket disconnected manually');
    }
  }
}