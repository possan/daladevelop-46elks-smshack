import bodyParser from 'body-parser'
import express from 'express'
import fs from 'fs'

import * as CONFIG from './config.mjs'
import * as Spotify from './spotify.mjs'
import * as StoredCredentials from './storedCredentials.mjs'
import * as TTS from './tts.mjs'

const PORT = 3000
const SPOTIFY_REDIRECT_URI = `${CONFIG.ENDPOINT}/spotifycallback`

const FEEDBACK_TEXTS = [
  '%artist, bra val!',
  'Oj, %artist!',
  'Hoppsan, %artist!',
  'Kul med %artist!'
]

// Set up webserver
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

Spotify.init(CONFIG.SPOTIFY_API_CLIENTID, CONFIG.SPOTIFY_API_CLIENTSECRET, SPOTIFY_REDIRECT_URI)

StoredCredentials.load().then((credentials) => {
  console.log('Loaded credentials:', credentials)
  if (credentials) {
    Spotify.setCredentials(credentials.accessToken, credentials.refreshToken)
  }
})

// The login endpoint to start Spotify authorization
app.get('/', (req, res) => {
  res.send('Ok?')
})

// The login endpoint to start Spotify authorization
app.get('/login', (req, res) => {
  console.log('GET /login')
  Spotify.getAuthorizeLink().then((authorizeURL) => {
    res.redirect(authorizeURL)
  })
})

// Spotify redirects back to this endpoint with an authorization code that can be turned into an access
// token for accessing their apis
app.get('/spotifycallback', (req, res) => {
  console.log('GET /spotifycallback', req.query)
  const code = req.query.code
  Spotify.useAuthorizationCode(code).then((credentials) => {
    console.log('Logged in to Spotify with credentials', credentials)
    if (credentials) {
      StoredCredentials.save(credentials)
      Spotify.setCredentials(credentials.accessToken, credentials.refreshToken)
    }
  })
  res.send('You have successfully authorized Spotify')
})

// The voice call entrypoint, prompt the user, wait for four digits, send them to the next endpoint
app.post('/voice', (req, res) => {
  console.log('POST /voice', req.body)
  res.json({
    ivr: `${CONFIG.ENDPOINT}/tts?text=${encodeURIComponent(
      'Välkommen till ring så streamar vi elektroniskt. Skriv in ett årtal, fyra siffror!'
    )}`,
    digits: 4,
    timeout: 20,
    repeat: 0,
    next: `${CONFIG.ENDPOINT}/voice/year`
  })
})

// The year endpoint, looks up a track and sends some feedback to the user then redirects to
// the thing that plays back the music
//
// You can test this endpoint with: curl -X POST -d 'result=1995' "http://localhost:3000/voice/year"
app.post('/voice/year', (req, res) => {
  console.log('POST /voice/year', req.body, req.params)
  const year = Math.max(1960, Math.min(2022, parseInt(req.body.result, 10)))
  const query = `year:${year} genre:electronic`

  Spotify.findRandomTopTrack(query).then((track) => {
    console.log('Using track', track)

    const randomFeedback = FEEDBACK_TEXTS[Math.floor(Math.random() * FEEDBACK_TEXTS.length)]

    res.json({
      play: `${CONFIG.ENDPOINT}/tts?text=${encodeURIComponent(
        randomFeedback.replace('%artist', track.artists[0].name)
      )}`,

      // quick hack, just pass the mp3 url as a querystring to the next endpoint
      next: `${CONFIG.ENDPOINT}/voice/playmp3?mp3=${encodeURIComponent(track.preview_url)}`
    })
  })
})

// This endpoint plays back the music to the user, when the music stops or if the user
// presses any key during the playback it will redirects to a new year prompt.
app.post('/voice/playmp3', (req, res) => {
  console.log('POST /voice/playmp3', req.body)
  const mp3url = req.query.mp3
  res.json({
    play: mp3url,
    next: `${CONFIG.ENDPOINT}/voice/nexttrack`
  })
})

// This is the repeated year prompt after listening to some music, wait for four digits then
// redirect back to the year endpoint
app.post('/voice/nexttrack', (req, res) => {
  console.log('POST /voice/nexttrack', req.body)
  res.json({
    ivr: `${CONFIG.ENDPOINT}/tts?text=${encodeURIComponent('Skriv in ett nytt årtal!')}`,
    digits: 4,
    timeout: 10,
    repeat: 0,
    next: `${CONFIG.ENDPOINT}/voice/year`
  })
})

// The text to speech endpoint, you can test it by visiting: http://localhost:3000/tts?text=Hej+världen
app.get('/tts', (req, res) => {
  console.log('GET /tts', req.query)
  const text = req.query.text
  TTS.getOrGenerateTTSFile(text).then((mp3file) => {
    if (!mp3file) {
      console.error('Failed to generate mp3 file')
      return res.send(502)
    }

    res.header({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline'
    })

    const buffer = fs.readFileSync(mp3file)
    return res.send(buffer)
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

setInterval(() => {
  Spotify.refreshCredentials().then((updatedCredentials) => {
    StoredCredentials.save(updatedCredentials)
  })
}, 30 * 60000)
