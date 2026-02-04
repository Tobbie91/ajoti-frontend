# Google OAuth Setup Instructions

## Steps to Configure Google OAuth

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project or Select Existing**
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in app name: "AJOTI ROSCA"
     - Add your email
     - Add authorized domains (if applicable)

5. **Configure OAuth Client ID**
   - Application type: "Web application"
   - Name: "AJOTI Frontend"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000`
     - Add your production domain when ready
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - Add your production domain when ready

6. **Copy Your Client ID**
   - After creating, you'll see your Client ID
   - Copy the Client ID (looks like: `xxxxx.apps.googleusercontent.com`)

7. **Update .env File**
   - Open the `.env` file in your project root
   - Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID:
     ```
     VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
     ```

8. **Restart Your Dev Server**
   - Stop the current dev server (Ctrl+C)
   - Run `npm run dev` again
   - The Google Sign-in button should now work!

## Testing

1. Go to http://localhost:5173 (Login page)
2. Click "Sign in with Google"
3. Select your Google account
4. You should be redirected to the Home page

## Important Notes

- Keep your Client ID secure (it's public but still should be in .env)
- Never commit the `.env` file to git (it's already in .gitignore)
- For production, add your production domain to authorized origins
- The `.env.example` file shows the format without real credentials

