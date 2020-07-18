'use strict';

import * as utils from './utils';
import searchItem from './search';
import type { APISocket } from 'airdcpp-apisocket';

const CONFIG_VERSION = 1;

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';


export default (socket: APISocket, extension: any) => {

  // INITIALIZATION
  const settings = SettingsManager(socket, {
    extensionName: extension.name,
    configFile: extension.configPath + 'config.json',
    configVersion: CONFIG_VERSION,
    definitions: utils.SettingDefinitions,
  });

  // https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-status-message
  // https://airdcpp.docs.apiary.io/#reference/hub-sessions/messages/send-status-message
  const printStatusMessage = (statusMessage: string, type: string, entityId: string|number) => {
    try {
      socket.post(`${type}/${entityId}/status_message`, {
        text: statusMessage,
        severity: 'info',
      });
    } catch (e) {
      printEvent(`Failed to send: ${e}`, 'error');
    }

  };

  // https://airdcpp.docs.apiary.io/#reference/hub-sessions/messages/send-chat-message
  // https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
  const sendChatMessage = (chatMessage: string, type: string, entityId: string|number) => {
    try {
      socket.post(`${type}/${entityId}/chat_message`, {
        text: chatMessage,
        severity: 'info',
      });
    } catch (e) {
      printEvent(`Failed to send: ${e}`, 'error');
    }

  };


  // Events are used for displaying and logging informative messages and errors to the application user.
  // Note that events are not bind to any specific context; some entities, such as hubs, provide similar
  // methods for showing information locally to the application user.
  // Messages will appear as popups and in the Events Log
  // https://airdcpp.docs.apiary.io/#reference/events
  const printEvent = (eventMessage: string, severity: string) => {
    socket.post('events', {
      text: `${eventMessage}`,
      severity,
    });
  };

  // Basic chat command handling, returns possible status message to post
  // TODO: (legacy, remove at some point)
  const checkLegacyChatCommand = async (message: any, type: string) => {
    const text = message.text;
    if (text.length === 0 || text[0] !== '/') {
      return null;
    }

    const command = message.text.split(' ');
    const args = command.slice(1);

    if (text === '/help') {
      return null;
    }
    return null;
  };

  // entityId is the session_id used to reference the current chat session
  // example https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
  const checkChatCommand = async (type: string, data: any, entityId: string|number) => {
    const { command, args } = data;

		switch (command) {
			case 'help': {
        break;
			}
		}

		return null;
  };

  const onChatCommand = async (type: string, data: any, entityId: string|number) => {
		const statusMessage = await checkChatCommand(type, data, entityId);
		if (statusMessage) {
      printStatusMessage(statusMessage, type, entityId);
		}
  };

  const onOutgoingHubMessage = (message: any, accept: any) => {
    checkLegacyChatCommand(message, 'hubs');

    accept();

  };

  const onOutgoingPrivateMessage = (message: any, accept: any) => {
    checkLegacyChatCommand(message, 'private');

    accept();

  };

  let searchInterval: ReturnType<typeof setInterval>;
  extension.onStart = async (sessionInfo: any) => {


    await settings.load();

    const subscriberInfo = {
      id: 'auto_downloader',
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
		searchInterval = setInterval(() => {
      searchItem(socket, extension, settings);
    }, settings.getValue('search_interval') * 60 * 1000, [socket, extension, settings]);

    // Perform an instant search as well
    // TODO: enable instant search - needs some debugging
		// searchItem(socket, extension, settings);


  };

	extension.onStop = () => {
		// We can't search without a socket
		clearInterval(searchInterval);
	};

};
