import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    /** Which workspace sidebar links are visible for non-admin accounts (admins always see everything). */
    sidebarSections: {
      type: [String],
      validate: {
        validator(entries) {
          if (!entries || entries.length === 0) return true;
          const allowed = new Set([
            "dashboard",
            "inventory",
            "payroll",
            "logistics",
            "staff",
            "settings",
          ]);
          return entries.every((section) => allowed.has(section));
        },
        message: "sidebarSections contains an invalid workspace key.",
      },
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
