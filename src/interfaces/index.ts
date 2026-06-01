export interface Host {
  id: string;
  name: string;
  ip: string;
  status?: 'ONLINE' | 'OFFLINE';
  lastChecked?: string;
}

