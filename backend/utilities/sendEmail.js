const nodeMailer=require("nodemailer")

const sendEmail = async (options) => {
    const transporter = nodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      service: 'gmail',
      auth: {
        user: 'krastogi227@gmail.com',
        pass: 'zyqrcxtvzsswppif',
      },
    });
  
    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };
  
    await transporter.sendMail(mailOptions);
  };
  
  module.exports = sendEmail;