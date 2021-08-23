/* eslint-disable no-var */

type SearchHistory = import('./types').SearchHistory;

declare var SEARCH_HISTORY: SearchHistory[];
declare var SETTINGS: any;
declare var SOCKET: any;
declare var SEARCH_INTERVAL: ReturnType<typeof setInterval>;
declare const EXTENSION_NAME: string;