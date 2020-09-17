import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'
import sharp from 'sharp'
import * as archiver from 'archiver'
const upload = multer({ dist: '/tmp' })
const archive = archiver('zip', {
  zlib: { level: 9 },
})

type File = {
  originalname: string
  buffer: Buffer
}

type Size = {
  width: number
  height: number
}

type ResizedBuffer = {
  size: Size
  buffer: Buffer
}

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

function getSizes(metadata: sharp.Metadata): Size[] {
  if (metadata.width === undefined || metadata.height === undefined) {
    return []
  }

  if (metadata.width > metadata.height) {
    return [
      { width: 2208, height: 1242 },
      { width: 2688, height: 1242 },
      { width: 2732, height: 2048 },
    ]
  } else {
    return [
      { width: 1242, height: 2208 },
      { width: 1242, height: 2688 },
      { width: 2048, height: 2732 },
    ]
  }
}

async function resize(file: File): Promise<ResizedBuffer[]> {
  const image = sharp(file.buffer)
  const metadata = await image.metadata()
  const sizes = getSizes(metadata)
  const promises = sizes.map((size) => {
    return image
      .resize({
        width: size.width,
        height: size.height,
        fit: 'contain',
        background: '#ffffff',
      })
      .toBuffer()
  })
  const buffers = await Promise.all(promises)
  return sizes.map((size, index) => {
    return { size, buffer: buffers[index] }
  })
}

function archiveFiles(originalFile: File, resizedBuffers: ResizedBuffer[]) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('/tmp/archive.zip')

    output.on('close', () => {
      resolve(true)
    })
    output.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)
    resizedBuffers.forEach((resizedBuffer) => {
      const parts = originalFile.originalname.split(/\./)
      const extension = parts[parts.length - 1]
      const name = parts.slice(0, parts.length - 1).join('.')
      archive.append(resizedBuffer.buffer, {
        name: `${name}_${resizedBuffer.size.width}x${resizedBuffer.size.height}.${extension}`,
      })
    })
    archive.finalize()
  })
}

export default async (req, res) => {
  await runMiddleware(req, res, upload.single('image'))
  const originalImage = req.file as File
  const resizedBuffers = await resize(originalImage)
  await archiveFiles(originalImage, resizedBuffers)

  const filename = originalImage.originalname.replace(/\.[^\.]+$/, '.zip')
  res.statusCode = 200
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  res.setHeader('Content-Type', 'application/octet-stream')
  res.send(fs.readFileSync('/tmp/archive.zip'))
}

export const config = {
  api: {
    bodyParser: false,
  },
}
