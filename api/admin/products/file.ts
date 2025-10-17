import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'
import { verifyToken } from '../../lib/auth'

const storage = process.env.GCS_KEY ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) }) : new Storage({ keyFilename: './gcs-key.json' })

const bucketName = 'hottochoco'
const folderName = 'Products'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // admin auth
  try {
    const tok = verifyToken(req as any, 'admin')
    if (!tok || !tok.ok) return res.status(403).end('Forbidden')
  } catch (e) {
    return res.status(403).end('Forbidden')
  }
  try {
    if (req.method === 'GET') {
      const q = req.query || {}
      const fileNameParam = q.fileName ?? q.filename ?? q.name
      const fileTypeParam = q.fileType ?? q.filetype ?? q.type

      const fileName = Array.isArray(fileNameParam) ? fileNameParam[0] : String(fileNameParam ?? '')
      const fileType = Array.isArray(fileTypeParam) ? fileTypeParam[0] : String(fileTypeParam ?? '')

      if (!fileName) {
        res.status(400).json({ error: 'Missing fileName' })
        return
      }

      const uniqueName = `${folderName}/${Date.now()}-${fileName}`
      const file = storage.bucket(bucketName).file(uniqueName)

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType: String(fileType)
      })

      res.status(200).json({ uploadUrl: url, publicUrl: `https://storage.googleapis.com/${bucketName}/${uniqueName}` })
      return
    }

    if (req.method === 'DELETE') {
      const q = req.query || {}
      const fileNameParam = q.fileName ?? q.filename ?? q.name
      const fileName = Array.isArray(fileNameParam) ? fileNameParam[0] : String(fileNameParam ?? '')

      if (!fileName) {
        res.status(400).json({ error: 'Missing fileName' })
        return
      }

      const objectName = fileName.startsWith(folderName) ? fileName : `${folderName}/${fileName}`
      const file = storage.bucket(bucketName).file(objectName)

      try {
        await file.delete()
        res.status(200).json({ message: 'File deleted' })
        return
      } catch (err: any) {
        console.error('GCS delete error:', err)
        if (err?.code === 404) {
          res.status(404).json({ error: 'File not found' })
          return
        }
        throw err
      }
    }

    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).end()
  } catch (err: any) {
    console.error('file handler error:', err)
    return res.status(500).json({ error: 'Failed to handle file operation' })
  }
}
