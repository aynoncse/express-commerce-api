const nodemailer = require('nodemailer');

const transporter  = nodemailer.createTransport({
   service: 'gmail',
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