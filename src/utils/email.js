const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendConfirmationEmail = async (order, userEmail) => {
  await transporter.sendMail({
    to: userEmail,
    subject: 'Order Confirmation',
    text: `Your order with ID ${order.id} has been confirmed!`,
  });
};

const sendPasswordResetEmail = async (userEmail, resetUrl) => {
  await transporter.sendMail({
    to: userEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Use the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this message.`,
    html: `<p>You requested a password reset.</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this message.</p>`,
  });
};

const sendVerificationEmail = async (userEmail, verifyUrl) => {
  await transporter.sendMail({
    to: userEmail,
    subject: 'Verify your email address',
    text: `Thanks for registering! Please verify your email by visiting the link below:\n\n${verifyUrl}\n\nIf you did not create an account, please ignore this email.`,
    html: `<p>Thanks for registering!</p><p>Verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>If you did not create an account, please ignore this email.</p>`,
  });
};

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};