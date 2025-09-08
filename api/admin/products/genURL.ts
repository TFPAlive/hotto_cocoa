import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'

const storage = new Storage({ keyFilename: './gcs-key.json' })
const bucketName = 'hottochoco'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  try {
    const { fileName, fileType } = req.query
    const uniqueName = `${Date.now()}-${fileName}`

    const [url] = await storage
      .bucket(bucketName)
      .file(uniqueName)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType: String(fileType),
      })

    res.status(200).json({
      uploadUrl: url,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${uniqueName}`,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
}
