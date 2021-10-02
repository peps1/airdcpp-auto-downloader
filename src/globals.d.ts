/* eslint-disable no-var */

type APISocket = import('airdcpp-apisocket').APISocket;

declare var DbPath: string;
declare var SETTINGS: any;
declare var SOCKET: APISocket;
declare var SEARCH_INTERVAL: ReturnType<typeof setInterval>;
declare var EXTENSION_NAME: string;