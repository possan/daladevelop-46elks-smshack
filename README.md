# DalaDevelop 46elks SMS-Hack night hack

A quick voice hack that prompts you to enter a year on the phone keypad then looks up one of the top tracks from that year and plays it back through the phone.

## Prerequisites

- [46elks account](https://46elks.se/account) with a number that supports incoming voice calls.

- [Spotify App](https://developer.spotify.com/) and account for querying the api for toplists.

- Public https endpoint that points to this hack. If you don't want to deploy this on a real server somewhere you can use a service like `ngrok` to get a public https endpoint that points to your local machine.

- This hack uses the `text-to-mp3` library to generate text to speech, which uses an "open" google TTS endpoints which it downloads audio from, we need to transcode that audio in order for it to work with the 46elks IVR service, we use `ffmpeg` for that, so that needs to be installed.

## Setting up

Use node 18 that supports native fetch.

Install the dependencies: `npm install`

Run `ngrok` or any other similar ssl loopback service to get your service running on a public https address. (eg. `https://example.com`)

Put that public https address without a trailing slash in the `ENDPOINT` constant in the `config.mjs` file.

Point your 46elks number `voice_start` webhook to the voice endpoint on your public https address. (eg. `https://example.com/voice`)

Register the redirect uri (`https://example.com/spotifycallback`) in your Spotify App so that we can log in, put the Spotify App credentials in the `SPOTIFY_API_CLIENTID` and `SPOTIFY_API_CLIENTSECRET` constants in `config.mjs`

Start the server: `npm run start`

Visit `http://localhost:3000/login` to log in to your Spotify account for the toplist lookups to work.

If everything works you should be able to dial your 46elks number and interact with this hack.
