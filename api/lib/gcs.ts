import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import path from 'path'

// Initialize Google Cloud Storage with environment-based configuration
const storage = process.env.GCS_KEY 
  ? new Storage({ credentials: JSON.parse(process.env.GCS_KEY) }) 
  : new Storage({ 
      keyFilename: path.join(process.cwd(), 'gcs-key.json'),
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id'
    })

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'hottochoco')

/**
 * Upload a file to Google Cloud Storage
 * @param filePath - Local file path to upload
 * @param destination - Destination path in the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadToGCS(filePath: string, destination: string): Promise<string> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found: ' + filePath)
    }

    // Upload file to GCS
    const [file] = await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      public: true // Make file publicly readable
    })

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`
    
    // Clean up local file
    try {
      fs.unlinkSync(filePath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup local file:', cleanupError)
    }

    return publicUrl
  } catch (error) {
    console.error('GCS upload error:', error)
    throw new Error('Failed to upload file to cloud storage')
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param filename - File name/path in the bucket
 */
export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete()
  } catch (error) {
    console.error('GCS delete error:', error)
    throw new Error('Failed to delete file from cloud storage')
  }
}

/**
 * Get a signed URL for uploading files directly to GCS
 * @param filename - Destination filename
 * @param contentType - MIME type of the file
 * @returns Signed URL for uploading
 */
export async function getSignedUploadUrl(filename: string, contentType: string): Promise<string> {
  try {
    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    }

    const [url] = await bucket.file(filename).getSignedUrl(options)
    return url
  } catch (error) {
    console.error('GCS signed URL error:', error)
    throw new Error('Failed to generate upload URL')
  }
}