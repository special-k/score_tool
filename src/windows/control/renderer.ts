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

import '../../index.css';
import {Tag as H, Fragment} from '../../ui_pack/html';
import State from '../../ui_pack/State';

const fighters = ['Кирилл Яковлев', 'bbb', 'ccc', 'ddd'];

let timeInterval: any;
const NOT_SELECT_ID = '--notselect--';

const state = new State({timeLeft: 120, started: false, redScore: 0, blueScore: 0, blueName: NOT_SELECT_ID, redName: NOT_SELECT_ID});

const inputClass = 'w-48 shrink-0 p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';
const buttonClass = 'w-48 shrink-0 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center';
const clearButton = 'mt-4 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center';

document.getElementById('app').appendChild(Fragment([
    H.d([
        state.render(() => H.select(
            [H.option(['Выберите соперника'], {disabled: '', selected: '', value: NOT_SELECT_ID}), ...fighters.map((f) => H.option([f]))],
            {
                class: inputClass,
                value: state.getValue('blueName'),
                change: (e: InputEvent) => {
                    state.setValue('blueName', (e.target as HTMLInputElement).value);
                    window.electronAPI.setBlue(state.getValue('blueName'));
                }
            }
        ), {on: ['blueName']}),
        state.render(() => H.input({
            class: inputClass,
            value: state.getValue('timeLeft'),
            type: 'number',
            change: (e: InputEvent) => {
                state.setValue('timeLeft', parseInt((e.target as HTMLInputElement).value, 10))
                window.electronAPI.setTime(state.getValue('timeLeft'));
            }}), {on: ['timeLeft']}),
        state.render(() => H.select(
            [H.option(['Выберите соперника'], {disabled: '', selected: '', value: NOT_SELECT_ID}), ...fighters.map((f) => H.option([f]))],
            {
                class: inputClass,
                value: state.getValue('redName'),
                change: (e: InputEvent) => {
                    state.setValue('redName', (e.target as HTMLInputElement).value);
                    window.electronAPI.setRed(state.getValue('redName'));
                }
            }
        ), {on: ['redName']}),
    ], {class: 'flex gap-4'}),
    H.d([
        state.render(() => H.input({class: inputClass, value: state.getValue('blueScore'), type: 'number', change: (e: InputEvent) => {
            state.setValue('blueScore', parseInt((e.target as HTMLInputElement).value, 10));
            window.electronAPI.setBlueScore(state.getValue('blueScore'));
        }}), {on: ['blueScore']}),
        state.render(() => H.button([state.getValue('started') ? 'Стоп' : 'Cтарт'], {class: buttonClass, click: () => {
            if (timeInterval) {
                clearInterval(timeInterval);
                timeInterval = null;
                state.setValue('started', false);
            } else {
                timeInterval = setInterval(() => {
                    state.setValue('timeLeft', state.getValue('timeLeft') - 1);
                    window.electronAPI.setTime(state.getValue('timeLeft'));
                    if (state.getValue('timeLeft') === 0) {
                        clearInterval(timeInterval);
                        timeInterval = null;
                        state.setValue('started', false);
                    }
                }, 1000);
                state.setValue('started', true);
            }
        }}), {on: ['started']}),
        state.render(() => H.input({class: inputClass, value: state.getValue('redScore'), type: 'number', change: (e: InputEvent) => {
            state.setValue('redScore', parseInt((e.target as HTMLInputElement).value, 10));
            window.electronAPI.setRedScore(state.getValue('redScore'));
        }}), {on: ['redScore']}),
    ], {class: 'flex gap-4 mt-4'}),
    H.button(['Очистить'], {
        class: clearButton,
        click: () => {
            state.setValues({
                timeLeft: 120,
                started: false,
                redScore: 0,
                blueScore: 0,
                blueName: NOT_SELECT_ID,
                redName: NOT_SELECT_ID,
            });
            window.electronAPI.setRedScore(state.getValue('redScore'));
            window.electronAPI.setBlueScore(state.getValue('blueScore'));
            window.electronAPI.setTime(state.getValue('timeLeft'));
            window.electronAPI.setRed(state.getValue('redName'));
            window.electronAPI.setBlue(state.getValue('blueName'));
        }
    })
]));
