/* eslint-disable @typescript-eslint/ban-ts-comment */
// https://airdcpp.docs.apiary.io/#reference/private-chat-sessions/methods/send-status-message

import { SeverityEnum } from 'types/api';

// https://airdcpp.docs.apiary.io/#reference/hub-sessions/messages/send-status-message
export const printStatusMessage = async (statusMessage: string, type: string, entityId: string|number) => {
  try {
    // @ts-ignore: global breaking unit testing
    global.SOCKET.post(`${type}/${entityId}/status_message`, {
      text: statusMessage,
      severity: 'info',
    });
  } catch (e) {
    printEvent(`Failed to send: ${e}`, SeverityEnum.ERROR);
  }
};

// Events are used for displaying and logging informative messages and errors to the application user.
// Note that events are not bind to any specific context; some entities, such as hubs, provide similar
// methods for showing information locally to the application user.
// Messages will appear as popups and in the Events Log
// https://airdcpp.docs.apiary.io/#reference/events
export const printEvent = async (eventMessage: string, severity: SeverityEnum) => {

  const logMessage = `${severity.toUpperCase()}: ${eventMessage}`;

  switch (severity) {
    case SeverityEnum.ERROR:
      // @ts-ignore: global breaking unit testing
      global.SOCKET.logger.error(logMessage);
      break;
    case SeverityEnum.WARNING:
      // @ts-ignore: global breaking unit testing
      global.SOCKET.logger.warn(logMessage);
      break;
    case SeverityEnum.INFO:
      // @ts-ignore: global breaking unit testing
      global.SOCKET.logger.info(logMessage);
      break;
    case SeverityEnum.NOTIFY:
      // @ts-ignore: global breaking unit testing
      global.SOCKET.logger.verbose(logMessage);
      break;
  };

  // @ts-ignore: global breaking unit testing
  global.SOCKET.post('events', {
    text: eventMessage,
    severity,
  });
};
