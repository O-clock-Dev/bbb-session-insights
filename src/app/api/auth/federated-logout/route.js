import { JWT, getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

function logoutParams(token) {
    return {
      post_logout_redirect_uri: process.env.NEXTAUTH_URL,
      id_token_hint: token.idToken
    };
  }
  
  function handleEmptyToken() {
    const response = { error: "No session present" };
    const responseHeaders = { status: 400 };
    return NextResponse.json(response, responseHeaders);
  }
  
  function sendEndSessionEndpointToURL(token) {
    const endSessionEndPoint = new URL(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
    );
    const params = logoutParams(token);
    endSessionEndPoint.search = new URLSearchParams(params).toString();
    const response = { url: endSessionEndPoint.href };
    console.log(response)
    return NextResponse.json(response);
  }
  
  export async function GET(req) {
    try {
      const token = await getToken({ req })
      if (token) {
        return sendEndSessionEndpointToURL(token);
      }
      return handleEmptyToken();
    } catch (error) {
      console.error(error);
      const response = {
        error: "Unable to logout from the session",
      };
      const responseHeaders = {
        status: 500,
      };
      return NextResponse.json(response, responseHeaders);
    }
  }