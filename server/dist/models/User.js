import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['FACULTY', 'HOD', 'BOS_COORDINATOR', 'ADMIN'], default: 'FACULTY', required: true },
    department: { type: String, required: false, trim: true, default: '' },
    designation: { type: String, required: false, trim: true, default: 'Assistant Professor' },
    programmeAccess: [{ type: String, trim: true }],
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
}, { timestamps: true });
export const User = mongoose.model('User', UserSchema);
