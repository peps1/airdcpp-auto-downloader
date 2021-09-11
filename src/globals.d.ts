/* eslint-disable no-var */

type APISocket = import('airdcpp-apisocket').APISocket;

// type DBData = import('./types').DBData;
// type Low = import('lowdb/lib').Low<DBData>;

declare var EXTENSION: any;
// declare var DB: Low;
declare var SETTINGS: any;
declare var SOCKET: APISocket;
declare var SEARCH_INTERVAL: ReturnType<typeof setInterval>;
declare var EXTENSION_NAME: string;