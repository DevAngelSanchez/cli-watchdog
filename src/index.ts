import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { Host } from './interfaces/index.ts';
import { sendDesktopNotification, pingHost } from './utils/index.ts'

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
const INTERVAL = Number(process.env.MONITOR_INTERVAL_MS) || 5000;

// Cargar inventario de IPs
const hostsPath = path.join(__dirname, '../hosts.json');
let networkHosts: Host[] = JSON.parse(fs.readFileSync(hostsPath, 'utf-8'));

// Almacen de memoria del estado actual de la red
let networkStatusReport: Host[] = [];

async function runWatchdog() {
  console.log(`\n[Watchdog] Iniciando ronda de verificación: ${new Date().toLocaleTimeString()}`);

  const updatedStatus: Host[] = [];

  for (const host of networkHosts) {
    const isAlive = await pingHost(host.ip);
    const currentStatus = isAlive ? 'ONLINE' : 'OFFLINE';

    //Buscar estado anterior para ver si hay cambios
    const previousHostState = networkStatusReport.find(h => h.id === host.id);
    
    if (previousHostState && previousHostState.status !== currentStatus) {
      // Hubo un cambio de estado, alerta inmediata
      const alertTitle = currentStatus === 'OFFLINE' ? 'Advertencia: ¡Equipo Caido!' : 'Info: Equipo recuperado';
      const alertMsg = `${host.name} (${host.ip}) esta ahora ${currentStatus}`;

      sendDesktopNotificication(alertTitle, alertMsg);
    }

    updatedStatus.push({
      ...host,
      status: currentStatus,
      lastChecked: new Date().toISOString(),
    });

    // Mostrar logs
    const statusIcon = !isAlive ? '' : '';
    console.log(`${statusIcon} ${host.name} (${host.ip} - ${currentStatus})`);
  }

  networkStatusReport = updatedStatus;
}

// endpoints

//ver el estado de la red en JSON
app.get('/api/status', (req: res) => {
  res.json({
    timestamp: new Date(),
    totalDevices: networkStatusReport.length,
    devices: networkStatusReport
  });
});

// Forzar escaneo manual
app.post('/api/scan', async (req, res) => {
  await runWatchdog();
  res.json({ message: "Escaneo manual completado con éxito.", data: networkStatusReport});
});

app.listen(PORT, () => {
  console.log(` Servidor HTTP del Watchdog corriendo en http://localhost:$PORT`);

  runWatchdog();

  setInterval(runWatchdog, INTERVAL);
})
