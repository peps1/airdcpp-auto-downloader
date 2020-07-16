'use strict';

import os from 'os';
import * as Utils from './utils';
import fs from 'fs';
import type { APISocket } from 'airdcpp-apisocket';
const CONFIG_VERSION = 1;

// Settings manager docs: https://github.com/airdcpp-web/airdcpp-extension-settings-js
import SettingsManager from 'airdcpp-extension-settings';

export default (socket: APISocket, extension: any) => {

  // Default settings
  const SettingDefinitions = [
    {
      key: 'search_interval',
      title: 'Search interval (minutes)',
      default_value: 5,
      type: 'number',
    }, {
      key: 'search_items',
      title: 'Search items',
      optional: true,
      default_value: [
        {
          pattern: 'ubuntu-install',
          extensions: 'iso;img',
          priority: 3,
          file_type: 'any',
        }
      ],
      type: 'list',
      item_type: 'struct',
      definitions: [
        ...Utils.searchQueryDefinitions,
        {
          key: 'priority',
          title: 'Priority',
          default_value: 3,
          type: 'number',
          options: Utils.priorityEnum,
        }, {
          key: 'target_directory',
          title: 'Target directory',
          default_value: '',
          type: 'directory_path',
          help: 'Leave empty to use the default download directory',
          optional: true,
        },
      ]
    }
  ];

	// INITIALIZATION
	const settings = SettingsManager(socket, {
		extensionName: extension.name,
		configFile: extension.configPath + 'config.json',
		configVersion: CONFIG_VERSION,
		definitions: [
			...SettingDefinitions,
		],
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
      const helpText = `

        User commands

        /uptime\tShow uptime (Client & System)\t\t\t(public, visible to everyone)
        /speed\tShow current network Upload/Download speed\t\t\t(public, visible to everyone)
        /os\t\tShow the operating system\t\t\t(public, visible to everyone)
        /stats\t\tShow various stats (Client, Uptime, Ratio, CPU)\t\t\t(public, visible to everyone)
        /ratio\t\tShow Upload/Download stats\t\t\t(public, visible to everyone)
        /sratio\tShow Session Upload/Download stats\t\t\t(public, visible to everyone)
        /version\tShow user-commands extension version\t\t\t(private, visible only to yourself)
        /list username /share/folder - List all items within a users shared folder, writing items to local file\t\t\t(private, visible only to yourself)

      `
      printStatusMessage(helpText, type, message.session_id)
    }
    return null;
  };

  // entityId is the session_id used to reference the current chat session
  // example https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
  const checkChatCommand = async (type: string, data: any, entityId: string|number) => {
    const { command, args } = data;

		switch (command) {
			case 'help': {
        const helpText = `

        User commands

        /uptime\tShow uptime (Client & System)\t\t\t(public, visible to everyone)
        /speed\tShow current network Upload/Download speed\t\t\t(public, visible to everyone)
        /os\t\tShow the operating system\t\t\t(public, visible to everyone)
        /stats\t\tShow various stats (Client, Uptime, Ratio, CPU)\t\t\t(public, visible to everyone)
        /ratio\t\tShow Upload/Download stats\t\t\t(public, visible to everyone)
        /sratio\tShow Session Upload/Download stats\t\t\t(public, visible to everyone)
        /version\tShow user-commands extension version\t\t\t(private, visible only to yourself)
        /list username /share/folder - List all items within a users shared folder, writing items to local file\t\t\t(private, visible only to yourself)

        `;
        printStatusMessage(helpText, type, entityId)
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
  };
};
