// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
    setTime: (value: number) => ipcRenderer.send('score:time', value),
    setBlueScore: (value: number) => ipcRenderer.send('score:blueScore', value),
    setRedScore: (value: number) => ipcRenderer.send('score:redScore', value),
    setBlue: (value: string) => ipcRenderer.send('score:blueName', value),
    setRed: (value: string) => ipcRenderer.send('score:redName', value),
    setMirred: (value: string) => ipcRenderer.send('score:mirred', value),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
