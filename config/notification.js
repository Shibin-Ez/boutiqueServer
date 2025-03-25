import { GoogleAuth } from "google-auth-library";

const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: 'https://www.googleapis.com/auth/firebase.messaging',
});

export const getAccessToken = async () => {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}