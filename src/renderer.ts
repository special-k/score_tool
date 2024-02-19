/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {Tag as H, Fragment} from './ui_pack/html';
import State from './ui_pack/State';

const state = new State({time: '-', redScore: '0', blueScore: '0', redName: '-', blueName: '-'});
window.electronAPI.onTimeUpdate((value: number) => state.setValue('time', value));
window.electronAPI.onRedScoreUpdate((value: number) => state.setValue('redScore', value));
window.electronAPI.onBlueScoreUpdate((value: number) => state.setValue('blueScore', value));
window.electronAPI.onRedUpdate((value: number) => state.setValue('redName', value));
window.electronAPI.onBlueUpdate((value: number) => state.setValue('blueName', value));
window.electronAPI.onMirredUpdate((value: number) => state.setValue('mirred', value));

document.getElementById('app').appendChild(state.render(() => H.d([
    H.d([], {class: `absolute ${state.getValue('mirred') ? 'right-0' : 'left-0'} top-0 bottom-0 w-1/2 bg-blue-700`}),
    H.d([], {class: `absolute ${state.getValue('mirred') ? 'left-0' : 'right-0'} top-0 bottom-0 w-1/2 bg-red-500`}),
    H.d([
        H.d([
            state.getValue('blueName')
        ], {class: 'flex-1 text-[5vw] relative text-center text-white'}),
        H.d([
            state.getValue('redName')
        ], {class: 'flex-1 text-[5vw] relative text-center text-white'}),
    ], {class: `flex ${state.getValue('mirred') ? 'flex-row-reverse' : ''}`}),
    H.d([H.d([String(state.getValue('time'))], {
        class: 'text-[12vw] text-white text-center bg-black rounded-lg w-[25vw] px-[2vw] bg-opacity-70'
    })], {class: 'relative flex justify-center'}),
    H.d([
        H.d([
            String(state.getValue('blueScore'))
        ], {class: 'flex-1 text-[18vw] leading-[18vw] relative text-center text-white'}),
        H.d([
            String(state.getValue('redScore'))
        ], {class: 'flex-1 text-[18vw] leading-[18vw] relative text-center text-white'}),
    ], {class: `flex ${state.getValue('mirred') ? 'flex-row-reverse' : ''}`}),
]), {on: ['time', 'redScore', 'blueScore', 'redName', 'blueName', 'mirred']}));
