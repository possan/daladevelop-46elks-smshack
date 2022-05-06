import SpotifyWebApi from 'spotify-web-api-node'

let spotifyApi

export const init = (clientId, clientSecret, redirectUri) => {
  spotifyApi = new SpotifyWebApi({
    clientId,
    clientSecret,
    redirectUri
  })
}

export const getAuthorizeLink = async () => {
  const scopes = ['user-read-private', 'user-read-email']
  const showDialog = true
  const responseType = 'code'
  const state = ''
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog, responseType)
  console.log(authorizeURL)
  return authorizeURL
}

export const useAuthorizationCode = async (code) => {
  return spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
      const accessToken = data.body['access_token']
      const refreshToken = data.body['refresh_token']

      console.log('The token expires in:', data.body['expires_in'])
      console.log('The access token is:', accessToken)
      console.log('The refresh token is:', refreshToken)

      spotifyApi.setAccessToken(accessToken)
      spotifyApi.setRefreshToken(refreshToken)

      return {
        accessToken,
        refreshToken
      }
    },
    function (err) {
      console.log('Something went wrong!', err)
    }
  )
}

export const setCredentials = async (accessToken, refreshToken) => {
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken)
  }
  if (refreshToken) {
    spotifyApi.setRefreshToken(refreshToken)
  }
}

const findTracks = async (query) => {
  return spotifyApi.searchTracks(query).then((result) => {
    let cleanTracks = result.body.tracks.items.filter((t) => t.preview_url).slice(0, 1)
    return cleanTracks
  })
}

export const findRandomTopTrack = async (query) => {
  return findTracks(query).then((tracks) => {
    let randomTrack = tracks[Math.floor(Math.random() * Math.min(tracks.length, 4))]
    return randomTrack
  })
}

export const refreshCredentials = () => {
  return spotifyApi.refreshAccessToken().then(
    function (data) {
      const accessToken = data.body['access_token']

      console.log('The access token has been refreshed!', accessToken)

      spotifyApi.setAccessToken(accessToken)

      return {
        accessToken
      }
    },
    function (err) {
      console.log('Could not refresh access token', err)
    }
  )
}
