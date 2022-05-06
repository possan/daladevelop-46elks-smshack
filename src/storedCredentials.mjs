import fs from 'fs'

const CREDENTIALS_FILE = 'temp/stored-credentials.json'
let lastCredentials = {}

export const load = async () => {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null
  }

  try {
    const credsJson = fs.readFileSync(CREDENTIALS_FILE, 'UTF-8')
    const creds = JSON.parse(credsJson)
    lastCredentials = { ...lastCredentials, ...creds }
    return creds
  } catch (e) {
    console.log('Failed to load credentials', e)
  }
  return null
}

export const save = async (credentials) => {
  lastCredentials = { ...lastCredentials, ...credentials }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(lastCredentials, null, 2), 'UTF-8')
}
