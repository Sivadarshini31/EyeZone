import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  platform: process.platform,
  isElectron: true,
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string>;
      platform: string;
      isElectron: boolean;
    };
  }
}
