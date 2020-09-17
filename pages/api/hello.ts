import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'
import * as archiver from 'archiver'
const upload = multer({ dist: '/tmp' })

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

export default async (req, res: NextApiResponse) => {
  await runMiddleware(req, res, upload.single('image'))

  res.statusCode = 200
  res.json(req.file)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
