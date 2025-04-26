const { MATRIX_ACCESS_TOKEN, MATRIX_HOMESERVER_URL } = process.env;

export const sendEvent = (roomId: string, content: any, type: string) => {
  return fetch(`${MATRIX_HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/send/${type}`, {
    method: "POST",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MATRIX_ACCESS_TOKEN}`,
    },
  });
};

export const sendMessage = (roomId: string, message: string, context = {}) => {
  return sendEvent(
    roomId,
    {
      body: message,
      msgtype: "m.text",
      context,
    },
    "m.room.message"
  );
};

export const getEvent = async (roomId: string, eventId: string) => {
  const response = await fetch(
    `${MATRIX_HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/event/${eventId}`,
    {
      headers: {
        Authorization: `Bearer ${MATRIX_ACCESS_TOKEN}`,
      },
    }
  );
  return response.json();
};

export const getRoomEvents = (roomId: string) => {
  return fetch(
    `${MATRIX_HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/messages?limit=10000&dir=b`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MATRIX_ACCESS_TOKEN}`,
      },
    }
  );
};

export const redactEvent = async (
  roomId: string,
  eventId: string,
  redactionReason: string
) => {
  const txn = Date.now();

  return fetch(
    `${MATRIX_HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/redact/${eventId}/${txn}`,
    {
      method: "PUT",
      body: JSON.stringify({
        reason: redactionReason,
      }),
      headers: {
        Authorization: `Bearer ${MATRIX_ACCESS_TOKEN}`,
      },
    }
  );
};
