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

module.exports = { sendConfirmationEmail };