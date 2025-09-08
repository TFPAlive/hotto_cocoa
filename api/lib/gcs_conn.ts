import { Storage as GCSStorage } from '@google-cloud/storage';
import * as path from 'path';

// Path to your service account key
const keyFilename = path.join(__dirname, 'gcs-key.json');

// Init storage client
const storage = new GCSStorage({ keyFilename });
const bucketName = 'your-bucket-name';
const bucket = storage.bucket(bucketName);

module.exports = bucket;
