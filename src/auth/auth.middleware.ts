import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import axios from "axios";
import * as dotenv from "dotenv";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

dotenv.config();

const COGNITO_USER_POOL_ID = process.env.AWS_USER_POOL_ID!;
const COGNITO_REGION = process.env.AWS_REGION!;
const COGNITO_JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

let cognitoKeys: any = null;

// Fetch and cache Cognito JWKS
export const fetchCognitoKeys = async () => {
  if (!cognitoKeys) {
    try {
      const response = await axios.get(COGNITO_JWKS_URL);
      cognitoKeys = response.data.keys;
    } catch (error) {
      console.error("Error fetching Cognito keys:", error);
      throw new Error("Failed to fetch authentication keys");
    }
  }
  return cognitoKeys;
};

// Helper function to verify token and get the decoded data
const verifyJwtToken = async (token: string) => {
  const keys = await fetchCognitoKeys();
  
  const header: any = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());
  const key = keys.find((k: any) => k.kid === header.kid);

  if (!key) {
    throw new Error("Invalid token signature");
  }

  const pem = jwkToPem(key);

  return new Promise<any>((resolve, reject) => {
    jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        reject(new Error("Unauthorized: Invalid token"));
      } else {
        resolve(decoded);
      }
    });
  });
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | null = null;

    // Extract token from query or authorization header
    if (req.query.token) {
      token = req.query.token as string;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log(`Token received: ${token}`);

    if (!token) {
      // Pass error to next middleware
      return next(new Error("Unauthorized: No token provided"));
    }

    // Verify the JWT token
    const decoded = await verifyJwtToken(token);
    req.user = decoded; // Attach decoded user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    // Pass error to next middleware
    return next(new Error("Unauthorized: Invalid token"));
  }
};

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Unauthorized: No token provided"));
    }

    // Fetch Cognito keys for validation
    const keys = await fetchCognitoKeys();
    
    // Decode the JWT header to get the kid (key id)
    const header: any = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());
    const key = keys.find((k: any) => k.kid === header.kid);

    if (!key) {
      throw new Error("Invalid token signature");
    }

    // Convert JWK to PEM format
    const pem = jwkToPem(key);
    
    // Verify the JWT token
    const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] });

    (req as any).user = decoded; // Attach decoded user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error: any) {
    return next(new Error("Unauthorized: " + error.message));
  }
};
