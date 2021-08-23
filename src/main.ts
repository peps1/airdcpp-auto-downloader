'use strict';

import type { APISocket } from 'airdcpp-apisocket';
import { onExtensionSettingsUpdated, SettingDefinitions } from './settings';
import { onChatCommand, onOutgoingHubMessage, onOutgoingPrivateMessage } from './chat';
import { initializeSearchInterval } from './search';

const CONFIG_VERSION = 1;


// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';

export default (socket: APISocket, fileExtension: any) => {

  global.SOCKET = socket;
  // TODO: save search history in settings
  global.SEARCH_HISTORY = [];

  // INITIALIZATION
  global.SETTINGS = SettingsManager(socket, {
    extensionName: fileExtension.name,
    configFile: fileExtension.configPath + 'config.json',
    configVersion: CONFIG_VERSION,
    definitions: SettingDefinitions,
  });

  fileExtension.onStart = async (sessionInfo: any) => {


    await global.SETTINGS.load();

    const subscriberInfo = {
      id: 'auto_downloader',
      name: 'Auto downloader',
    };

    if (sessionInfo.system_info.api_feature_level >= 4) {
      socket.addListener('hubs', 'hub_text_command', onChatCommand.bind(null, 'hubs'));
      socket.addListener('private_chat', 'private_chat_text_command', onChatCommand.bind(null, 'private_chat'));
      socket.addListener('extensions', 'extension_settings_updated', onExtensionSettingsUpdated);
    } else {
      socket.addHook('hubs', 'hub_outgoing_message_hook', onOutgoingHubMessage, subscriberInfo);
      socket.addHook('private_chat', 'private_chat_outgoing_message_hook', onOutgoingPrivateMessage, subscriberInfo);
    }

		// Set interval
    initializeSearchInterval(global.SETTINGS.getValue('search_interval'));

    // Perform an instant search on start
    // TODO: enable instant search - needs some debugging
		// searchItem(socket, extension, settings);


  };

	fileExtension.onStop = () => {
		// We can't search without a socket
		clearInterval(global.SEARCH_INTERVAL);
	};

};
