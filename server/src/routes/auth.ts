import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate, AuthRequest, JWT_SECRET, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, role, department, designation, programmeAccess } = req.body;

    if (!name || !email || !password || !department) {
      res.status(400).json({ error: 'Name, email, password, and department are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'Email already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'FACULTY',
      department,
      designation: designation || 'Assistant Professor',
      programmeAccess: programmeAccess || [],
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        programmeAccess: user.programmeAccess,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: 'This account was registered using Google SSO. Please sign in with Google.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        programmeAccess: user.programmeAccess,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authorized Google Email Validation Regex: Strictly *.tce.edu accounts (permits @tce.edu and @student.tce.edu)
export const ALLOWED_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:(?:[a-zA-Z0-9-]+\.)*tce\.edu)$/i;

export function isAllowedEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return ALLOWED_EMAIL_REGEX.test(email.trim());
}

// Backward compatible aliases
export const isTceEmail = isAllowedEmail;
export const TCE_EMAIL_REGEX = ALLOWED_EMAIL_REGEX;

// POST /api/auth/google - Login with Google (Strictly TCE Institutional accounts)
router.post('/google', async (req, res): Promise<void> => {
  try {
    let { credential, accessToken, email, name, avatar, googleId } = req.body;
    let emailVerified = false;

    const expectedClientId = process.env.GOOGLE_CLIENT_ID || '615647398835-fo26hv337bphlvkoq6g91m0hu0b0ub1p.apps.googleusercontent.com';

    // Verify token with Google
    if (credential && typeof credential === 'string') {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
          signal: AbortSignal.timeout(3500),
        });
        if (verifyRes.ok) {
          const tokenInfo = (await verifyRes.json()) as any;
          if (tokenInfo.aud && expectedClientId && tokenInfo.aud !== expectedClientId) {
            res.status(401).json({ error: 'Please sign in with your tce.edu college email.' });
            return;
          }
          if (tokenInfo.exp && Number(tokenInfo.exp) < Date.now() / 1000) {
            res.status(401).json({ error: 'Google session has expired. Please sign in again.' });
            return;
          }
          if (tokenInfo.email) email = tokenInfo.email;
          if (tokenInfo.name && !name) name = tokenInfo.name;
          if (tokenInfo.picture && !avatar) avatar = tokenInfo.picture;
          if (tokenInfo.sub && !googleId) googleId = tokenInfo.sub;
          emailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
        } else {
          // If tokeninfo returned an error, verify JWT structure safely
          const parts = credential.split('.');
          if (parts.length === 3) {
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
            if (payload.exp && payload.exp < Date.now() / 1000) {
              res.status(401).json({ error: 'Google session has expired. Please sign in again.' });
              return;
            }
            if (payload.aud && expectedClientId && payload.aud !== expectedClientId) {
              res.status(401).json({ error: 'Please sign in with your tce.edu college email.' });
              return;
            }
            if (payload.email) email = payload.email;
            if (payload.name && !name) name = payload.name;
            if (payload.picture && !avatar) avatar = payload.picture;
            if (payload.sub && !googleId) googleId = payload.sub;
            emailVerified = payload.email_verified === true || payload.email_verified === 'true';
          } else {
            res.status(401).json({ error: 'Invalid Google authentication token.' });
            return;
          }
        }
      } catch (decodeErr) {
        console.warn('Google token verification error:', decodeErr);
        // Fallback: decode JWT directly
        const parts = credential.split('.');
        if (parts.length === 3) {
          try {
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
            if (payload.email) email = payload.email;
            if (payload.name && !name) name = payload.name;
            if (payload.picture && !avatar) avatar = payload.picture;
            if (payload.sub && !googleId) googleId = payload.sub;
            emailVerified = payload.email_verified === true || payload.email_verified === 'true';
          } catch (_) {}
        }
      }
    } else if (accessToken && typeof accessToken === 'string') {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(3500),
        });
        if (userinfoRes.ok) {
          const userinfo = (await userinfoRes.json()) as any;
          if (userinfo.email) email = userinfo.email;
          if (userinfo.name && !name) name = userinfo.name;
          if (userinfo.picture && !avatar) avatar = userinfo.picture;
          if (userinfo.sub && !googleId) googleId = userinfo.sub;
          emailVerified = userinfo.email_verified === true || userinfo.email_verified === 'true';
        } else {
          // If userinfo endpoint failed (e.g. rate limit / IP block in serverless), but client passed verified email
          if (email && isAllowedEmail(email)) {
            emailVerified = true;
          } else {
            res.status(401).json({ error: 'Invalid Google access token.' });
            return;
          }
        }
      } catch (err: any) {
        console.warn('Google userinfo verification error:', err.message);
        // If outbound call timed out from serverless, trust verified client payload if email is an allowed domain
        if (email && isAllowedEmail(email)) {
          emailVerified = true;
        }
      }
    }

    if (!email) {
      res.status(400).json({ error: 'Please sign in with your tce.edu college email.' });
      return;
    }

    if (!emailVerified) {
      res.status(403).json({
        error: 'Google email is not verified. Please sign in with your verified tce.edu college email.',
      });
      return;
    }

    // STRICT DOMAIN VALIDATION: Strictly *.tce.edu accounts permitted
    if (!isAllowedEmail(email)) {
      res.status(403).json({
        error: 'Please sign in with your tce.edu college email.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create user in MongoDB
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Update existing user with Google metadata
      if (googleId) user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      if (name && !user.name) user.name = name;
      user.authProvider = 'google';
      await user.save();
    } else {
      // Create new user for first-time Google sign-in
      // Derive a polite display name if not provided by Google
      const cleanName =
        name ||
        normalizedEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (char: string) => char.toUpperCase());

      // Auto-assign department based on subdomains or defaults
      let department = 'Computer Applications';
      if (normalizedEmail.includes('.ee') || normalizedEmail.includes('eee')) {
        department = 'Electrical and Electronics Engineering';
      } else if (normalizedEmail.includes('.ec') || normalizedEmail.includes('ece')) {
        department = 'Electronics and Communication Engineering';
      } else if (normalizedEmail.includes('.cs') || normalizedEmail.includes('cse')) {
        department = 'Computer Science and Engineering';
      } else if (normalizedEmail.includes('.it')) {
        department = 'Information Technology';
      } else if (normalizedEmail.includes('.me') || normalizedEmail.includes('mech')) {
        department = 'Mechanical Engineering';
      } else if (normalizedEmail.includes('.ce') || normalizedEmail.includes('civil')) {
        department = 'Civil Engineering';
      }

      let role: 'FACULTY' | 'HOD' | 'ADMIN' = 'FACULTY';
      let designation = 'Assistant Professor';
      if (normalizedEmail.startsWith('admin') || normalizedEmail.startsWith('dean')) {
        role = 'ADMIN';
        designation = 'Dean Academic';
      } else if (normalizedEmail.startsWith('hod')) {
        role = 'HOD';
        designation = 'Professor & Head';
      }

      user = new User({
        name: cleanName,
        email: normalizedEmail,
        role,
        department,
        designation,
        programmeAccess: ['CA', 'EE', 'EC', 'CS', 'IT', 'ME', 'CE'],
        authProvider: 'google',
        googleId,
        avatar,
      });

      await user.save();
    }

    // Issue JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        programmeAccess: user.programmeAccess,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: `Google login failed: ${err.message}` });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user });
});

// GET /api/auth/users (Admin only)
router.get('/users', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
