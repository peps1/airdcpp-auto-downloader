import { SeverityEnum } from 'types/api';
import { autoDlStats } from './commands/stats';
import { printEvent, printStatusMessage } from './log';

const helpText = `
        #######################
        Auto Downloader
        #######################

        /autodl-stats\tShow some auto downloader statistics\t\t\t(private, visible only to yourself)
`;

// https://airdcpp.docs.apiary.io/#reference/hub-sessions/messages/send-chat-message
// https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
export const sendChatMessage = (chatMessage: string, type: string, entityId: string|number) => {
  try {
    global.SOCKET.post(`${type}/${entityId}/chat_message`, {
      text: chatMessage,
    });
  } catch (e) {
    printEvent(`Failed to send: ${e}`, SeverityEnum.ERROR);
  }

};

// Basic chat command handling, returns possible status message to post
// TODO: (legacy, remove at some point)
const checkLegacyChatCommand = async (message: any, type: string) => {
  const text = message.text;
  if (text.length === 0 || text[0] !== '/') {
    return null;
  }

  if (text === '/help') {
    printStatusMessage(helpText, type, message.session_id);
  } else if (text === '/autodl-stats') {
    autoDlStats(type, message.session_id);
  }
  return null;
};

// entityId is the session_id used to reference the current chat session
// example https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
const checkChatCommand = async (type: string, data: any, entityId: string|number) => {
  // const { command, args } = data;
  const { command } = data;

  switch (command) {
    case 'help': {
      printStatusMessage(helpText, type, entityId);
      break;
    }
    case 'autodl-stats': {
      autoDlStats(type, entityId);
      break;
    }
  }

  return null;
};

export const onChatCommand = async (type: string, data: any, entityId: string|number) => {
  const statusMessage = await checkChatCommand(type, data, entityId);
  if (statusMessage) {
    printStatusMessage(statusMessage, type, entityId);
  }
};

export const onOutgoingHubMessage = (message: any, accept: any) => {
  checkLegacyChatCommand(message, 'hubs');

  accept();

};

export const onOutgoingPrivateMessage = (message: any, accept: any) => {
  checkLegacyChatCommand(message, 'private');

  accept();

};
