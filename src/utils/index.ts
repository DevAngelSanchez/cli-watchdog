import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function sendDesktopNotificication(title: string, message: string) {
  exec(`notify-send "${title}" "${message}" -u critical`);
}

export async function pingHost(ip: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`ping -c 1 -W 2 ${ip}`);
    // Si quieres ver si realmente llega el texto:
    // console.log(`Resultado real de ${ip}:`, stdout);
    return true;
  } catch (error: any) {
    // ESTO NOS DIRÁ EL SECRETO:
    console.log(`\n[DEBUG] Falló el ping a ${ip}. El sistema operativo dice:`);
    console.log(`Código de error: ${error.code}`);
    console.log(`Mensaje: ${error.message}`);
    console.log(`Stderr: ${error.stderr}\n`);
    return false;
  }
}
