// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    onTimeUpdate: (callback: Function) => ipcRenderer.on('score:time', (_event, value) => callback(value)),
    onBlueScoreUpdate: (callback: Function) => ipcRenderer.on('score:blueScore', (_event, value) => callback(value)),
    onRedScoreUpdate: (callback: Function) => ipcRenderer.on('score:redScore', (_event, value) => callback(value)),
    onBlueUpdate: (callback: Function) => ipcRenderer.on('score:blueName', (_event, value) => callback(value)),
    onRedUpdate: (callback: Function) => ipcRenderer.on('score:redName', (_event, value) => callback(value)),
    onMirredUpdate: (callback: Function) => ipcRenderer.on('score:mirred', (_event, value) => callback(value)),
})
