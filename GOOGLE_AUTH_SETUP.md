# Google sign-in setup

SpotOn uses Firebase Authentication as the source of truth for Google sign-in and Google Drive access.

## Firebase

1. In Firebase Console, enable **Authentication > Sign-in method > Google**.
2. Enable **Email/Password** under the same Sign-in method page.
3. Under **Authentication > Settings > Authorized domains**, add `localhost`, `spot-on-3.vercel.app`, and `expense-tracker-3.v0.build`, plus each preview hostname you use.
4. Keep the exact deployed Vercel hostname and preview hostname authorized; Firebase does not accept wildcard domains.
3. Confirm the Firebase web app configuration in `firebase-applet-config.json` belongs to the same Firebase project.

## Google Cloud

1. Open the Google Cloud project linked to Firebase.
2. Configure the OAuth consent screen and add the Drive scopes required by the app.
3. Add the Firebase auth handler domain shown by Firebase to **OAuth client > Authorized JavaScript origins** and **Authorized redirect URIs**. Do not add secrets to the client.

## Vercel

Redeploy after changing Firebase or Google Cloud settings. Preview deployments use their own hostname, so each hostname that will run SpotOn must be authorized.

If sign-in reports `unauthorized-domain`, add the hostname shown in the error to Firebase Authorized domains. If Google reports `redirect_uri_mismatch`, copy the redirect URL from the Google error and add it to the OAuth client exactly, including protocol and path.

The existing `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` variables are not used by the current Firebase client flow. Do not add NextAuth alongside Firebase unless migrating the entire auth architecture.
