import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service provider
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password' // or use environment variables for security
  }
});

export default transporter;


// To be added to the userController
// import transporter from '../config/nodemailer.js';

// // In your user registration function
// const sendConfirmationEmail = (userEmail, confirmationToken) => {
//   const mailOptions = {
//     from: 'your-email@gmail.com',
//     to: userEmail,
//     subject: 'Account Confirmation',
//     text: `Please confirm your account by clicking the link: ${confirmationToken}`
//     // You can also use HTML: html: '<p>HTML version of the message</p>'
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log('Email sent: ' + info.response);
//     }
//   });
// };
