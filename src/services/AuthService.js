import {google} from 'googleapis';

/**
 * Service for handling authentication information
 */
export default class AuthService {
  static #CLIENT_ID = process.env.CLIENT_ID;
  static #CLIENT_SECRET = process.env.CLIENT_SECRET;
  static #REDIRECT_URI = process.env.REDIRECT_URI;
  static #SCOPES = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];

  #oauthClient;

  /**
   * @constructor
   */
  constructor() {
    this.#oauthClient = new google.auth.OAuth2(
      AuthService.#CLIENT_ID,
      AuthService.#CLIENT_SECRET,
      AuthService.#REDIRECT_URI
    );
  }

  /**
   * Generates an authentication URL
   * @returns
   */
  generateAuthUrl() {
    return this.#oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: AuthService.#SCOPES,
      include_granted_scopes: true,
      // Display the consent screen to the user
      prompt: 'consent'
    });
  }

  /**
   * Extracts the authorization code from the redirect url and
   * uses it to generate the access, ID, and refresh tokens.
   * @param {*} authCode
   */
  async handleOAuthRedirect(authCode) {
    const {tokens} = await this.#oauthClient.getToken(authCode);
    return {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
  }

  async getNewIDToken(refreshToken) {
    this.#oauthClient.setCredentials({refresh_token: refreshToken});
    const tokens = await this.#oauthClient.refreshAccessToken();
    return tokens.credentials.id_token;
  }

  async getUserData(idToken) {
    const data = await this.#oauthClient.verifyIdToken({idToken});
    return data.getPayload();
  }

  async revokeRefreshToken(refreshToken) {
    await this.#oauthClient.revokeToken(refreshToken);
  }
}