import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from 'next/server'
import executeSSHCommand from "@/utils/executeSSHCommand";
import redisHandler from "@/utils/redisHandler";

async function checkRedis(token) {
  try {
    const cachedData = await redisHandler(token, "get", "teleporter");
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null; 
  } catch (error) {
    console.error("Error checking Redis cache:", error);
    return null;
  }
}

async function fetchManuKey(token) {
  const name = token.name
  const email = token.email
  const ssh_server = process.env.OLD_TELEPORTER_SERVER
  const ssh_user = process.env.OLD_TELEPORTER_USER
  const ssh_key = process.env.OLD_TELEPORTER_SSH_KEY
  try {
    // Call executeSSHCommand and wait for its result
    const data = await new Promise((resolve, reject) => {
      executeSSHCommand(
        ssh_server, 
        ssh_user, 
        ssh_key,
        `sudo /usr/bin/php /opt/System/gen-activation-key-keyring.php "${name}" ${email}`, 
        (error, data) => {
        if (error) {
          reject(error);
        } else {
          redisHandler(JSON.parse(data), "set", "teleporter")
          resolve(data);
        }
      });
    });
    // Return the result
    return data;
  } catch (error) {
    // Handle errors
    console.error('Error sending command', error);
    throw error;
  }
}


export async function GET(req) {
  try {
    const token = await getToken({ req })
    if (token) {
      const cachedData = await checkRedis(token);
      if (cachedData) {
        console.log("Cache hit !")
        return NextResponse.json(cachedData);
      }
      console.log("Cache not found, generating new key...")
      const result = await fetchManuKey(token);
      const parsedResult = JSON.parse(result)
      return NextResponse.json(parsedResult);
    }
    return handleEmptyToken();
  } catch (error) {
    console.error(error);
    const response = {
      error: error,
    };
    const responseHeaders = {
      status: 500,
    };
    return NextResponse.json(response, responseHeaders);
  }
}