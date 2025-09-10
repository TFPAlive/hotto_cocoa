import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'

const storage =
  process.env.GCS_KEY
    ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) })
    : new Storage({ keyFilename: './gcs-key.json' })

const bucketName = 'hottochoco'
const folderName = 'Products'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end()
  }

  try {
    const { fileName } = req.query
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Missing fileName' })
    }
    const objectName = fileName.startsWith(folderName) ? fileName : `${folderName}/${fileName}`

    const file = storage.bucket(bucketName).file(objectName)
    await file.delete()

    res.status(200).json({ message: 'File deleted' })
  } catch (err: any) {
    console.error(err)
    if (err.code === 404) {
      return res.status(404).json({ error: 'File not found' })
    }
    res.status(500).json({ error: 'Failed to delete file' })
  }
}
