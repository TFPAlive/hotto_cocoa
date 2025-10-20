# Hotto Cocoa - Setup Guide

## Database Setup

The database schema is organized into logical SQL files for easy deployment and maintenance:

### Database Files Structure

- `database/Hottochoco_Complete.sql` - Complete database with all tables and sample data
- `database/01_core_tables.sql` - Core application tables only (User, Product, Order, Cart, etc.)
- `database/02_mypage_tables.sql` - MyPage feature tables only (Favorites, Reviews, PaymentMethods)
- `database/03_security_tables.sql` - Security and settings tables only (LoginSessions, UserSettings, SecuritySettings)
- `database/setup.sql` - Setup script that imports the complete database

### Database Deployment

1. **Option 1: Complete setup with sample data (Recommended)**
   ```sql
   SOURCE database/Hottochoco_Complete.sql;
   ```

2. **Option 2: Use setup script**
   ```sql
   SOURCE database/setup.sql;
   ```

3. **Option 3: Modular setup (tables only, no sample data)**
   ```sql
   SOURCE database/01_core_tables.sql;
   SOURCE database/02_mypage_tables.sql;
   SOURCE database/03_security_tables.sql;
   ```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=hotto_cocoa

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_gcs_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/gcs-service-account-key.json

# Optional: GCS Configuration
GCS_BUCKET_NAME=your_bucket_name  # Alternative to GOOGLE_CLOUD_STORAGE_BUCKET
```

### Google Cloud Storage Setup

1. **Create a GCS Bucket**
   - Go to Google Cloud Console
   - Create a new bucket or use existing one
   - Set appropriate permissions (public read for uploaded images)

2. **Service Account Setup**
   - Create a service account in Google Cloud Console
   - Grant "Storage Admin" or "Storage Object Admin" permissions
   - Download the service account key as JSON
   - Place it in your project root as `gcs-key.json`
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to point to this file

3. **Bucket Configuration**
   - Enable uniform bucket-level access
   - Configure CORS if needed for web uploads
   - Set lifecycle rules for cleanup if desired

## API Features

### **MyPage API Endpoints**

All MyPage functionality is implemented with proper authentication and data validation:

1. **User Profile**: `/api/user/profile.ts` - Profile data management (avatar URLs from file endpoint)
2. **Orders**: `/api/user/orders.ts` - Order history and details
3. **Reviews**: `/api/user/reviews.ts` - Product reviews and ratings
4. **Favorites**: `/api/user/favorites.ts` - Favorite products management
5. **Cart**: `/api/user/cart.ts` - Shopping cart operations
6. **Address**: `/api/user/address.ts` - Address book management
7. **Payment Methods**: `/api/user/payment-methods.ts` - Payment method management
8. **Order History**: `/api/user/order-history.ts` - Detailed order tracking
9. **Login Sessions**: `/api/user/login-sessions.ts` - Active session management
10. **Security Settings**: `/api/user/security.ts` - Security preferences
11. **Localization**: `/api/user/localization-settings.ts` - Language and locale settings
12. **Privacy Settings**: `/api/user/privacy-settings.ts` - Privacy controls
13. **Data Export**: `/api/user/data-export.ts` - GDPR-compliant data export
14. **Account Deletion**: `/api/user/account-deletion.ts` - Account deletion with data cleanup
15. **Place Order**: `/api/user/placeOrder.ts` - Order placement functionality

### File Upload System

The application includes a unified file upload system using Google Cloud Storage:

#### Unified File Handler (`api/lib/file-handler.ts`)
- **Centralized Logic**: Single handler for all file operations across different folders
- **Smart Routing**: Automatically determines folder based on request path or explicit parameter
- **Authentication**: Admin auth for Products/Drinks, user auth for UserImages
- **Signed URLs**: Generate secure upload URLs with 15-minute expiration
- **File Management**: Upload and delete operations with proper error handling

#### Endpoints
- `/api/admin/products/file` - Product images (Products folder)
- `/api/admin/drinks/file` - Drink images (Drinks folder)  
- `/api/user/file` - User avatars and images (UserImages folder)

#### GCS Utility Functions (`api/lib/gcs.ts`)
- **Upload Function**: `uploadToGCS(filePath, destination)` - Upload files to GCS
- **Delete Function**: `deleteFromGCS(filename)` - Remove files from GCS  
- **Signed URLs**: `getSignedUploadUrl(filename, contentType)` - Generate secure upload URLs
- **Supported Types**: Images (JPEG, PNG, GIF, WebP) with size limits
- **Security**: Automatic cleanup of old files when updating profiles

#### File Organization
- **Products**: `/Products/{timestamp}-{filename}`
- **Drinks**: `/Drinks/{timestamp}-{filename}`
- **UserImages**: `/UserImages/{timestamp}-{filename}`

### Currency Utilities

Centralized currency formatting functions in `api/lib/currency.ts`:

- **formatPrice(amount, currency)** - Format prices with proper currency symbols
- **convertCurrency(amount, from, to)** - Currency conversion (placeholder for external API)

## Development Notes

### Code Organization

- **Database Schema**: Separated from API logic into dedicated SQL files
- **Authentication**: Centralized JWT verification across all endpoints
- **Error Handling**: Consistent error responses and proper HTTP status codes
- **Type Safety**: Full TypeScript support with proper type definitions
- **File Uploads**: Secure file handling with validation and cleanup

### Security Features

- JWT-based authentication for all user endpoints
- Input validation and sanitization
- SQL injection prevention using prepared statements
- File upload restrictions (type, size, naming)
- Session management and tracking
- GDPR compliance features (data export, deletion)

### Dependencies

All required packages are included in `package.json`:

- `@google-cloud/storage` - Google Cloud Storage integration
- `formidable` - File upload handling
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token management
- `mysql2` - MySQL database connectivity

## Testing

After setup, verify the system by:

1. **Database Connection**: Check that all tables are created successfully
2. **Authentication**: Test login/register functionality
3. **File Uploads**: Test profile avatar upload functionality  
4. **API Endpoints**: Verify all MyPage endpoints respond correctly
5. **GCS Integration**: Confirm files are uploaded to the correct bucket

## Troubleshooting

### Common Issues

1. **GCS Upload Errors**: Check service account permissions and bucket configuration
2. **Database Connection**: Verify environment variables and database credentials
3. **JWT Errors**: Ensure JWT_SECRET is set and consistent
4. **File Upload Size**: Check Vercel/hosting provider upload limits
5. **CORS Issues**: Configure bucket CORS settings for web uploads

### Logging

Enable detailed logging by checking:
- Database connection errors in console
- GCS operation results and error messages
- JWT token validation outcomes
- File upload progress and errors