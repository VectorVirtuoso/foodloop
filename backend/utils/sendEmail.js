// backend/utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Create a transporter using standard Gmail routing
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define the email payload
  const mailOptions = {
    from: `"FoodLoop Radar" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Dispatch the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;