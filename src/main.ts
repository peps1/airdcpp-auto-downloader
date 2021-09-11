'use strict';


import { APISocket } from 'airdcpp-apisocket';
import { SettingDefinitions, migrate } from './settings';
import { initLowDb } from './db';
import { initializeSearchInterval, runSearch } from './search';
import { onChatCommand, onOutgoingHubMessage, onOutgoingPrivateMessage } from './chat';

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';
import { SessionInfo } from './types/api';


const CONFIG_VERSION = 2;

export default (socket: APISocket, extension: any) => {


  // global.DB = lowDb(extension);
  global.SOCKET = socket;
  global.EXTENSION = extension;

  extension.onStart = async (sessionInfo: SessionInfo) => {

    await initLowDb();

    // INITIALIZATION
    global.SETTINGS = SettingsManager(socket, {
      extensionName: extension.name,
      configFile: extension.configPath + 'config.json',
      configVersion: CONFIG_VERSION,
      definitions: SettingDefinitions,
    });

    await global.SETTINGS.load(migrate);

    const subscriberInfo = {
      id: extension.name,
      name: 'Auto downloader',
    };

    if (sessionInfo.system_info.api_feature_level >= 4) {
      socket.addListener('hubs', 'hub_text_command', onChatCommand.bind(null, 'hubs'));
      socket.addListener('private_chat', 'private_chat_text_command', onChatCommand.bind(null, 'private_chat'));
    } else {
      socket.addHook('hubs', 'hub_outgoing_message_hook', onOutgoingHubMessage, subscriberInfo);
      socket.addHook('private_chat', 'private_chat_outgoing_message_hook', onOutgoingPrivateMessage, subscriberInfo);
    }

    // Set interval
    initializeSearchInterval(global.SETTINGS.getValue('search_interval'));

    global.SETTINGS.onValuesUpdated = async (updatedValues: any) => {
      // Reset search interval
      if (Object.prototype.hasOwnProperty.call(updatedValues, 'search_interval')) {
        clearInterval(global.SEARCH_INTERVAL);
        initializeSearchInterval(updatedValues.search_interval);
      }
    };

    // Perform an instant search on start
    runSearch();


  };

  extension.onStop = async () => {
    // We can't search without a socket
    clearInterval(global.SEARCH_INTERVAL);
  };

};
