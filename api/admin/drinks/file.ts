import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'
import { verifyToken } from '../../lib/auth'

const storage = process.env.GCS_KEY ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) }) : new Storage({ keyFilename: './gcs-key.json' })

const bucketName = 'hottochoco'
const folderName = 'Drinks'

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

      try {
        // Extract the path from the URL if a full URL is provided
        let filePath = fileName
        if (fileName.includes('storage.googleapis.com')) {
          const urlParts = fileName.split(`${bucketName}/`)
          if (urlParts.length > 1) {
            filePath = urlParts[1]
          }
        }

        const file = storage.bucket(bucketName).file(filePath)
        await file.delete()
        res.status(200).json({ message: 'File deleted successfully' })
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError)
        res.status(404).json({ error: 'File not found or could not be deleted' })
      }
      return
    }

    res.setHeader('Allow', ['GET', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('File handler error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}