import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@syllabusforge/shared';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  department: string;
  designation: string;
  programmeAccess: string[];
  googleId?: string;
  avatar?: string;
  authProvider?: 'local' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['FACULTY', 'HOD', 'ADMIN'], default: 'FACULTY', required: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    programmeAccess: [{ type: String, trim: true }],
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
