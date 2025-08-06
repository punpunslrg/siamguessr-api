# Google OAuth Setup Guide

## 1. Google Cloud Console Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. เลือกโปรเจกต์หรือสร้างใหม่
3. ไปที่ **APIs & Services** > **Credentials**
4. คลิก **Create Credentials** > **OAuth 2.0 Client IDs**

## 2. OAuth 2.0 Client Configuration

### Application Type
- เลือก **Web application**

### Authorized JavaScript Origins
```
http://localhost:8890
http://localhost:3001
http://localhost:5173
```

### Authorized Redirect URIs
```
http://localhost:8890/api/auth/google/callback
http://localhost:3001/auth/google/callback
```

## 3. Environment Variables

ใน `.env` file:
```
GOOGLE_CLIENT_ID=1081057281107-q3suq3got84d4satpjrargsk5ek1uid8.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 4. Testing

### Test Server
```bash
node test-oauth.js
```

### Test URLs
- OAuth Test: http://localhost:3001/auth/google
- Status Check: http://localhost:3001/

### Main Server
```bash
npm run dev
```

### Main URLs
- OAuth: http://localhost:8890/api/auth/google
- Status: http://localhost:8890/

## 5. Common Issues

1. **Invalid redirect_uri**: ตรวจสอบ callback URL ใน Google Console
2. **CORS errors**: ตรวจสอบ origin ใน CORS config
3. **Session issues**: ตรวจสอบ SESSION_SECRET ใน .env
4. **Database errors**: ตรวจสอบ Prisma connection และ schema

## 6. Debug Steps

1. ตรวจสอบ environment variables
2. ทดสอบด้วย test server ก่อน
3. ตรวจสอบ database connection
4. ดู console logs สำหรับ errors