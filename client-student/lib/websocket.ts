/**
 * WebSocket client pentru actualizări în timp real ale orarului.
 */
import type { Schedule } from '@/types/schedule';

export type ScheduleUpdateMessage = {
  type: 'schedule_update';
  action: 'create' | 'update' | 'delete' | 'refresh_all';
  schedule?: Schedule;
  all_schedules?: Schedule[];
  timestamp?: string;
};

export type WebSocketMessage = ScheduleUpdateMessage | { type: 'connected' | 'pong'; message?: string; connection_count?: number };

type ScheduleUpdateCallback = (schedules: Schedule[]) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: Event) => void;

class ScheduleWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 secunde
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;
  private shouldReconnect = true;
  private isConnecting = false; // Flag pentru a preveni conexiuni simultane
  
  private scheduleUpdateCallbacks: Set<ScheduleUpdateCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  
  private wsUrl: string;

  constructor() {
    // Folosește același URL ca API-ul (din api.ts)
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const apiUrl = new URL(apiBaseUrl);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    this.wsUrl = `${protocol}//${apiUrl.host}/ws/schedule`;
  }

  /**
   * Conectează clientul la serverul WebSocket.
   */
  connect(): void {
    // Previne conexiuni duplicate
    if (this.isConnecting) {
      console.log('⚠️ WebSocket în proces de conectare, se ignoră apelul duplicat');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✓ WebSocket deja conectat');
      return;
    }

    // Dacă există o conexiune în proces, așteaptă
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ WebSocket în proces de conectare, se ignoră apelul duplicat');
      return;
    }

    // Curăță conexiunea veche dacă există (în stări CLOSING sau CLOSED)
    if (this.ws && (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED)) {
      this.ws = null;
    }

    this.isManuallyDisconnected = false;
    this.isConnecting = true;
    
    try {
      console.log(`🔌 Conectare WebSocket la ${this.wsUrl}...`);
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('✓ WebSocket conectat cu succes');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Eroare la parsarea mesajului WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket deconectat');
        this.isConnecting = false;
        this.ws = null;
        

        if (!this.isManuallyDisconnected && this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('✗ Număr maxim de încercări de reconectare atins');
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          // Eroare în timpul conectării - va fi gestionată în onclose
          return;
        }
        console.error('✗ Eroare WebSocket:', error);
        this.notifyErrorCallbacks(error);
      };
    } catch (error) {
      console.error('✗ Eroare la crearea conexiunii WebSocket:', error);
      this.isConnecting = false;
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Deconectează clientul de la serverul WebSocket.
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.shouldReconnect = false;
    this.isConnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch (error) {
        console.error('Eroare la deconectarea WebSocket:', error);
      }
      this.ws = null;
    }
  }

  /**
   * Programează o reconectare.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff
    
    console.log(`🔄 Tentativă de reconectare ${this.reconnectAttempts}/${this.maxReconnectAttempts} în ${delay}ms...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Procesează mesajele primite de la server.
   */
  private handleMessage(message: WebSocketMessage): void {
    if (message.type === 'connected') {
      console.log(`✓ WebSocket conectat. ${message.connection_count || 0} clienți conectați.`);
      return;
    }

    if (message.type === 'pong') {
      // Răspuns la ping - nu facem nimic
      return;
    }

    if (message.type === 'schedule_update') {
      this.handleScheduleUpdate(message);
    }
  }

  /**
   * Procesează actualizări de orar.
   */
  private handleScheduleUpdate(message: ScheduleUpdateMessage): void {
    console.log(`📡 Primită actualizare orar: ${message.action}`);

    if (message.action === 'refresh_all' && message.all_schedules) {
      // Refresh complet - trimitem toate schedule-urile
      this.notifyScheduleUpdateCallbacks(message.all_schedules);
    } else {
      // Pentru create/update/delete, indică că trebuie reîncărcat
      // Array gol indică că trebuie să se facă refresh manual
      this.notifyScheduleUpdateCallbacks([]);
    }
  }

  /**
   * Adaugă un callback pentru actualizări de orar.
   */
  onScheduleUpdate(callback: ScheduleUpdateCallback): () => void {
    this.scheduleUpdateCallbacks.add(callback);
    
    // Returnează o funcție pentru a elimina callback-ul
    return () => {
      this.scheduleUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Adaugă un callback pentru evenimente de conectare.
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Adaugă un callback pentru erori.
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notifică toți callback-urile de actualizare.
   */
  private notifyScheduleUpdateCallbacks(schedules: Schedule[]): void {
    this.scheduleUpdateCallbacks.forEach((callback) => {
      try {
        callback(schedules);
      } catch (error) {
        console.error('Eroare în callback-ul de actualizare:', error);
      }
    });
  }

  /**
   * Notifică toți callback-urile de conectare.
   */
  private notifyConnectionCallbacks(): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Eroare în callback-ul de conectare:', error);
      }
    });
  }

  /**
   * Notifică toți callback-urile de eroare.
   */
  private notifyErrorCallbacks(error: Event): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Eroare în callback-ul de eroare:', err);
      }
    });
  }

  /**
   * Verifică dacă WebSocket-ul este conectat.
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Exportă o instanță singleton
export const scheduleWebSocket = new ScheduleWebSocketClient();

