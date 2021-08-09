import { printEvent, printStatusMessage } from './log';

// https://airdcpp.docs.apiary.io/#reference/hub-sessions/messages/send-chat-message
// https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
export const sendChatMessage = (chatMessage: string, type: string, entityId: string|number) => {
  try {
    global.SOCKET.post(`${type}/${entityId}/chat_message`, {
      text: chatMessage,
    });
  } catch (e) {
    printEvent(`Failed to send: ${e}`, 'error');
  }

};

// Basic chat command handling, returns possible status message to post
// TODO: (legacy, remove at some point)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkLegacyChatCommand = async (message: any, type: string) => {
  const text = message.text;
  if (text.length === 0 || text[0] !== '/') {
    return null;
  }

  // currently not used
  // const command = message.text.split(' ');
  // const args = command.slice(1);

  if (text === '/help') {
    return null;
  }
  return null;
};

// entityId is the session_id used to reference the current chat session
// example https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-chat-message
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkChatCommand = async (type: string, data: any, entityId: string|number) => {
  // const { command, args } = data;
  const { command } = data;

  switch (command) {
    case 'help': {
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
