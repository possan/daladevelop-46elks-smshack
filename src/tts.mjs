import fs from 'fs'
import txtomp3 from 'text-to-mp3'
import { exec } from 'child_process'
import crypto from 'crypto'

txtomp3.attributes.tl = 'sv-se'

export const getOrGenerateTTSFile = async (text) => {
  const shasum = crypto.createHash('sha1')
  shasum.update(text)
  const prefix = shasum.digest('hex')

  const mp3filename = `temp/${prefix}-orig.mp3`
  const wavfilename = `temp/${prefix}-wav.wav`
  const mp3filename2 = `temp/${prefix}-new.mp3`

  if (fs.existsSync(mp3filename2)) {
    return mp3filename2
  }

  return new Promise((resolve) => {
    txtomp3.getMp3(text, function (err, binaryStream) {
      if (err) {
        console.log(err)
        return resolve(null)
      }

      var file = fs.createWriteStream(mp3filename)
      file.write(binaryStream)
      file.end()

      // First convert whatever mp3 we get from the library into a standard wavefile
      var cmd1 = `ffmpeg -i "${mp3filename}" "${wavfilename}"`
      exec(cmd1, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`)
          return resolve(null)
        }
        // console.log(`stderr: ${stderr}`);
        // console.log(`stdout: ${stdout}`);

        // Aaaand then back to a mp3 again :)
        var cmd2 = `ffmpeg -i "${wavfilename}" "${mp3filename2}"`
        exec(cmd2, (error2, stdout2, stderr2) => {
          if (error2) {
            console.log(`error: ${error2.message}`)
            return resolve(null)
          }
          // console.log(`stderr: ${stderr2}`);
          // console.log(`stdout: ${stdout2}`);

          return resolve(mp3filename2)
        })
      })
    })
  })
}
