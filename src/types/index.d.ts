import { electronAPI } from "../preload";

declare global {
    interface Window {electronAPI: any}
}
