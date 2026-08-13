import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  let credential;
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    try {
      const resolvedPath = path.resolve(process.cwd(), saPath);
      if (fs.existsSync(resolvedPath)) {
        const saContent = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        credential = cert(saContent);
        console.log(`[Firebase Admin] Initialized with service account from: ${resolvedPath}`);
      }
    } catch (err) {
      console.error('[Firebase Admin Error] Failed to load service account credential:', err);
    }
  }

  initializeApp({
    projectId: firebaseConfig.projectId,
    ...(credential ? { credential } : {}),
  });
}

export const adminAuth = getAuth();
export default adminAuth;
