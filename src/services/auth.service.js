import prisma from "../config/prisma.config.js"
import emailService from "./email.service.js"
import hashService from "./hash.service.js"
import createError from "../utils/create-error.util.js"
import crypto from 'crypto'

const authService = {}

authService.findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      User: true,
    },
  });
}

authService.findUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      User: true,
    }
  })
}

authService.createAccount = (data) => {
  return prisma.user.create({ data })
}


authService.storeRefreshToken = (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน
  return prisma.refreshToken.upsert({
    where: { accountId: userId },
    update: { token, expiresAt },
    create: { accountId: userId, token, expiresAt },
  });
};

authService.findPatientProfileByAccountId = (accountId) => {
  return prisma.patient.findUnique({
    where: { accountId }
  });
};

authService.findDoctorProfileByAccountId = (accountId) => {
  return prisma.doctor.findUnique({
    where: { accountId }
  });
};

authService.updateLastLogin = (userId) => {
  return prisma.account.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  })
}

authService.requestPasswordReset = async (email) => {
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) throw createError(404, "Account with this email not found.");

  const otp = crypto.randomInt(1000, 9999).toString();
  const hashedOtp = await hashService.hash(otp);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.account.update({
    where: { email },
    data: {
      passwordResetToken: hashedOtp,
      passwordResetExpires: otpExpires
    }
  });

  try {
    await emailService.sendOtpEmail(account.email, otp);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw createError(500, "Could not send OTP email.");
  }
};

authService.verifyOtp = async (email, otp) => {
  const account = await prisma.account.findUnique({
    where: { email }
  });

  if (!account || !account.passwordResetToken || account.passwordResetExpires < new Date()) {
    throw createError(400, "OTP is invalid or has expired.");
  }

  const isMatch = await hashService.comparePassword(otp, account.passwordResetToken);
  if (!isMatch) {
    throw createError(400, "Invalid OTP provided.");
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.account.update({
    where: { id: account.id },
    data: {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: resetTokenExpires,
    }
  });

  return resetToken;
};

authService.resetPasswordWithToken = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const account = await prisma.account.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gte: new Date() }
    }
  });

  if (!account) {
    throw createError(400, "Password reset token is invalid or has expired.");
  }

  const hashedNewPassword = await hashService.hash(newPassword);

  await prisma.account.update({
    where: { id: account.id },
    data: {
      password: hashedNewPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });
};


authService.linkGoogleToAccount = (id, googleId) => {
  return prisma.account.update({
    where: { id },
    data: { googleId: googleId },
  });
};

authService.linkFacebookToAccount = (id, facebookId) => {
  return prisma.account.update({
    where: { id },
    data: { facebookId: facebookId },
  });
};

authService.reactivateAndLinkFacebook = (id, facebookId) => {
  return prisma.account.update({
    where: { id },
    data: {
      isActive: true,
      facebookId: facebookId,
    },
  });
};

authService.deactivateAccountByFacebookId = async (facebookId) => {
  const account = await prisma.account.findUnique({
    where: { facebookId },
  });

  if (!account) {
    console.warn(`Deactivation request for non-existent facebookId: ${facebookId}`);
    return;
  }

  return prisma.account.update({
    where: { id: account.id },
    data: { isActive: false },
  });
};

export default authService;

