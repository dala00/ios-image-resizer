import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'
import * as archiver from 'archiver'
const upload = multer({ dist: '/tmp' })
const archive = archiver('zip', {
  zlib: { level: 9 },
})

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

function archiveFiles(req) {
  return new Promise((resolve) => {
    const output = fs.createWriteStream('/tmp/archive.zip')

    output.on('close', () => {
      console.log('close')
      resolve(true)
    })
    output.on('error', (err) => {
      throw err
    })

    archive.pipe(output)
    archive.append(req.file.buffer, { name: 'file1.png' })
    archive.append(req.file.buffer, { name: 'file2.png' })
    console.log('finalize')
    archive.finalize()
  })
}

export default async (req, res) => {
  await runMiddleware(req, res, upload.single('image'))
  await archiveFiles(req)

  res.statusCode = 200
  res.setHeader('Content-disposition', 'attachment; filename=test.zip')
  res.setHeader('Content-Type', 'application/octet-stream')
  res.send(fs.readFileSync('/tmp/archive.zip'))
  // res.json(req.file
}

export const config = {
  api: {
    bodyParser: false,
  },
}
