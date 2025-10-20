import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Storage } from '@google-cloud/storage'
import { verifyToken, AuthRequest } from './auth'

// Initialize storage with environment-based configuration
const storage = process.env.GCS_KEY 
  ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) }) 
  : new Storage({ keyFilename: './gcs-key.json' })

const bucketName = process.env.GCS_BUCKET_NAME || 'hottochoco'

// Folder mapping based on request path or explicit folder parameter
const getFolderName = (req: VercelRequest): string => {
  // Check for explicit folder parameter first
  const folderParam = req.query.folder
  if (folderParam) {
    return Array.isArray(folderParam) ? folderParam[0] : String(folderParam)
  }

  // Determine folder based on request path
  const path = req.url || ''
  
  if (path.includes('/admin/products/')) return 'Products'
  if (path.includes('/admin/drinks/')) return 'Drinks'
  if (path.includes('/user/') || path.includes('user')) return 'UserImages'
  
  // Default fallback
  return 'Uploads'
}

// Determine required authentication level based on folder
const getAuthLevel = (folderName: string): 'admin' | 'user' => {
  return ['Products', 'Drinks'].includes(folderName) ? 'admin' : 'user'
}

export default async function fileHandler(req: VercelRequest, res: VercelResponse) {
  try {
    const folderName = getFolderName(req)
    const authLevel = getAuthLevel(folderName)

    // Verify authentication based on folder type
    try {
      const authReq = req as AuthRequest
      const token = verifyToken(authReq, authLevel)
      if (!token || !token.ok) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    } catch (e) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'GET') {
      // Generate signed URL for uploading
      const q = req.query || {}
      const fileNameParam = q.fileName ?? q.filename ?? q.name
      const fileTypeParam = q.fileType ?? q.filetype ?? q.type

      const fileName = Array.isArray(fileNameParam) ? fileNameParam[0] : String(fileNameParam ?? '')
      const fileType = Array.isArray(fileTypeParam) ? fileTypeParam[0] : String(fileTypeParam ?? '')

      if (!fileName) {
        return res.status(400).json({ error: 'Missing fileName parameter' })
      }

      // Create unique filename with timestamp
      const uniqueName = `${folderName}/${Date.now()}-${fileName}`
      const file = storage.bucket(bucketName).file(uniqueName)

      try {
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType: String(fileType)
        })

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueName}`
        
        return res.status(200).json({ 
          uploadUrl: url, 
          publicUrl,
          folder: folderName
        })
      } catch (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError)
        return res.status(500).json({ error: 'Failed to generate upload URL' })
      }
    }

    if (req.method === 'DELETE') {
      // Delete file from storage
      const q = req.query || {}
      const fileNameParam = q.fileName ?? q.filename ?? q.name ?? q.url
      const fileName = Array.isArray(fileNameParam) ? fileNameParam[0] : String(fileNameParam ?? '')

      if (!fileName) {
        return res.status(400).json({ error: 'Missing fileName parameter' })
      }

      try {
        // Handle both file paths and full URLs
        let filePath = fileName
        
        // If it's a full URL, extract the file path
        if (fileName.includes('storage.googleapis.com')) {
          const urlParts = fileName.split(`${bucketName}/`)
          if (urlParts.length > 1) {
            filePath = urlParts[1]
          }
        } else if (!fileName.startsWith(folderName)) {
          // If it's just a filename, add the folder prefix
          filePath = `${folderName}/${fileName}`
        }

        const file = storage.bucket(bucketName).file(filePath)
        await file.delete()
        
        return res.status(200).json({ 
          message: 'File deleted successfully',
          deletedFile: filePath
        })
      } catch (deleteError: any) {
        console.error('Error deleting file:', deleteError)
        
        if (deleteError?.code === 404) {
          return res.status(404).json({ error: 'File not found' })
        }
        
        return res.status(500).json({ error: 'Failed to delete file' })
      }
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })

  } catch (error) {
    console.error('File handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Utility function to create file handlers for specific folders
 * This can be used to create dedicated endpoints while reusing the same logic
 */
export function createFileHandlerForFolder(folder: string) {
  return async function(req: VercelRequest, res: VercelResponse) {
    // Override the folder detection by adding it to query
    req.query = { ...req.query, folder }
    return fileHandler(req, res)
  }
}