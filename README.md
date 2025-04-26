# WhatsApp Matrix Link Summarizer

A Matrix integration that listens to WhatsApp bridge chats, extracts links, and provides AI-generated summaries.

## Features
- Listens to Matrix rooms connected to WhatsApp
- Extracts links from messages
- Scrapes website content from links
- Generates AI-powered summaries of content
- Forwards these summaries to a designated room

## Getting started

1. Clone the repo
2. Copy the `.env.example` file and rename to `.env`
3. Register on Matrix ([app.element.io](https://app.element.io) is a popular way)
4. Copy your user id, homeserver and access token from Element into the `.env` file. Here is a screenshot: ![element user id](element_user_id.png) ![element homserver and access token](element_homeserver_access_token.png)
5. Create a WhatsApp group and invite your testing buddy to it
6. Start conversation with @whatsappbot on a homeserver (find homeserver url at in-person event) and follow the login process
7. Open the WhatsApp chat you want to connect to through Element
8. Copy the room id of the WhatsApp chat into the `MONITORED_ROOM_ID` field in the `.env` file
9. Create another room for summaries and copy its ID into the `FORWARDING_ROOM_ID` field
10. Get an API key for an AI service (like OpenAI) and add it to the `AI_API_KEY` field
11. Run the command `bun install`
12. Run the command `bun run dev`
13. Ask your testing buddy to send a message with a link to the WhatsApp group
14. Marvel in delight as the bot processes the link and posts a summary to your designated room

## Environment Variables

This app requires several environment variables to function properly:

### Required Variables:
- `MATRIX_HOMESERVER_URL`: Your Matrix homeserver URL
- `MATRIX_ACCESS_TOKEN`: Your Matrix access token
- `MATRIX_USER_ID`: Your Matrix user ID
- `MONITORED_ROOM_ID`: The room ID to monitor for links
- `FORWARDING_ROOM_ID`: The room ID where summaries will be posted
- `AI_API_KEY`: API key for the AI service used for summarization

### Optional Variables:
- `AI_API_URL`: Custom API endpoint (defaults to OpenAI)
- `AI_MODEL`: Custom model name (defaults to gpt-3.5-turbo)

For testing you can replace the `MONITORED_ROOM_ID` with just a normal Matrix room id, making it easier to test by yourself.
