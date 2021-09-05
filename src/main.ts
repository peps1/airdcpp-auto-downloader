'use strict';


import lowDb from 'db';

import { APISocket, SubscriptionRemoveHandler } from 'airdcpp-apisocket';
import { onExtensionSettingsUpdated, SettingDefinitions, migrate } from './settings';
import { onChatCommand, onOutgoingHubMessage, onOutgoingPrivateMessage } from './chat';
import { initializeSearchInterval } from './search';

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';
import { SessionInfo } from './types/api';


const CONFIG_VERSION = 2;

export default (socket: APISocket, extension: any) => {


  // eslint-disable-next-line no-console
  console.log(extension);
  global.DB = lowDb(extension);


  // eslint-disable-next-line no-console
  console.log(global.DB.data);


  global.SOCKET = socket;
  global.EXTENSION = extension;
  // TODO: save search history in settings

  let removeHubTextCommandListener: SubscriptionRemoveHandler;
  let removePrivateChatTextCommandListener: SubscriptionRemoveHandler;
  let removeExtensionSettingsUpdatedListener: SubscriptionRemoveHandler;
  let removeHubOutgoingMessageHook: SubscriptionRemoveHandler;
  let removePrivateChatOutgoingMessageHook: SubscriptionRemoveHandler;

  extension.onStart = async (sessionInfo: SessionInfo) => {

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
      removeHubTextCommandListener = await socket.addListener('hubs', 'hub_text_command', onChatCommand.bind(null, 'hubs'));
      removePrivateChatTextCommandListener = await socket.addListener('private_chat', 'private_chat_text_command', onChatCommand.bind(null, 'private_chat'));
      removeExtensionSettingsUpdatedListener = await socket.addListener('extensions', 'extension_settings_updated', onExtensionSettingsUpdated);
    } else {
      removeHubOutgoingMessageHook = await socket.addHook('hubs', 'hub_outgoing_message_hook', onOutgoingHubMessage, subscriberInfo);
      removePrivateChatOutgoingMessageHook = await socket.addHook('private_chat', 'private_chat_outgoing_message_hook', onOutgoingPrivateMessage, subscriberInfo);
    }

		// Set interval
    initializeSearchInterval(global.SETTINGS.getValue('search_interval'));

    // Perform an instant search on start
    // TODO: enable instant search - needs some debugging
		// searchItem(socket, extension, settings);


  };

	extension.onStop = async (sessionInfo: SessionInfo) => {
		// We can't search without a socket
		clearInterval(global.SEARCH_INTERVAL);
    // if (sessionInfo.system_info.api_feature_level >= 4) {
    //   removeHubTextCommandListener();
    //   removePrivateChatTextCommandListener();
    //   removeExtensionSettingsUpdatedListener();
    // } else {
    //   removeHubOutgoingMessageHook();
    //   removePrivateChatOutgoingMessageHook();
    // }
	};

};
