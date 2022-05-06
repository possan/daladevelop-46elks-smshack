import fs from 'fs'

const CREDENTIALS_FILE = 'temp/stored-credentials.json'

export const load = async () => {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null
  }

  try {
    const credsJson = fs.readFileSync(CREDENTIALS_FILE, 'UTF-8')
    const creds = JSON.parse(credsJson)
    return creds
  } catch (e) {
    console.log('Failed to load credentials', e)
  }
  return null
}

export const save = async (credentials) => {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'UTF-8')
}
