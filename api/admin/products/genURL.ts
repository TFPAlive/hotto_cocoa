import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'

const storage = process.env.GCS_KEY ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) }) : new Storage({ keyFilename: './gcs-key.json' })

const bucketName = 'hottochoco'
const folderName = 'Products'

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', ['GET'])
		return res.status(405).end()
	}

	try {
		const { fileName, fileType } = req.query
		const uniqueName = `${folderName}/${Date.now()}-${fileName}`

		const file = storage.bucket(bucketName).file(uniqueName)

		const [url] = await file.getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000, contentType: String(fileType) })

		// return signed URL and the final public URL
		res.status(200).json({ uploadUrl: url, publicUrl: `https://storage.googleapis.com/${bucketName}/${uniqueName}` })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Failed to generate upload URL' })
	}
}