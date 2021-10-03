'use strict';


import { APISocket } from 'airdcpp-apisocket';
import { SettingDefinitions, migrate } from './settings';
import { getDb } from './localdb';
import { initializeSearchInterval, runSearch } from './search';
import { onChatCommand, onOutgoingHubMessage, onOutgoingPrivateMessage } from './chat';

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';
import { SessionInfo } from './types/api';
import { deDupeSearchHistory } from 'utils';


const CONFIG_VERSION = 2;

export default (socket: APISocket, extension: any) => {


  global.SOCKET = socket;
  global.DbPath = extension.configPath + 'db.json';

  extension.onStart = async (sessionInfo: SessionInfo) => {

    const db = await getDb(global.DbPath);

    // on start do dedupe of db once
    // TODO: disable in next version or latest at final 1.0
    const dedupedDb = deDupeSearchHistory(db.get('search_history').value());
    await db.get('search_history').set(dedupedDb).save();

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
    clearInterval(global.SEARCH_INTERVAL);
    const db = await getDb(global.DbPath);
    await db.save();
  };

};
