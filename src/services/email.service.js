import nodemailer from "nodemailer";

const emailService = {}
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


emailService.sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Siamguessr" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Confirm password for changing password on siamguessr.`,
    html: `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #7F8C8D; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="padding: 20px; text-align: center;">
          <h2 style="color: #34495E; margin-bottom: 20px;">Your confirm password.</h2>
          <p>Please use password below to completely setting new password.</p>
          <p>This password avialable for 5 minutes</p>
          <div style="background-color: #EAF8FA; border-radius: 5px; padding: 10px 20px; margin: 20px 0; display: inline-block;">
            <p style="font-size: 24px; font-weight: bold; color: #34495E; letter-spacing: 5px; margin: 0;">${otp}</p>
          </div>
          <p style="font-size: 14px; color: #7F8C8D;">Please ignore this email if you didn't request for new password setting.</p>
        </div>
        <div style="background-color: #f7f7f7; padding: 20px; text-align: left;">
          <p style="margin: 0; font-size: 14px;">Best regard,<br>Siamguessr team</p>
          <img 
            src="" 
            alt="Siamguessr Logo" 
            style="width: 120px; height: auto; margin-top: 15px;"
          >
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }
}


// emailService.sendAppointmentConfirmationEmail = async (appointmentDetails) => {
//   const { 
//     patientEmail, 
//     patientName, 
//     doctorName, 
//     appointmentDateTime, // Expects a JavaScript Date object
//     telemedicineUrl, 
//     telemedicineRoomId 
//   } = appointmentDetails;

//   // Format date and time for Thai locale
//   const formattedDate = new Date(appointmentDateTime).toLocaleDateString('th-TH', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     weekday: 'long',
//   });
//   const formattedTime = new Date(appointmentDateTime).toLocaleTimeString('th-TH', {
//     hour: '2-digit',
//     minute: '2-digit',
//   });

//   const mailOptions = {
//     from: `"ทักหมอ (TakMor)" <${process.env.EMAIL_USER}>`,
//     to: patientEmail,
//     subject: `ยืนยันการนัดหมายแพทย์กับ ${doctorName}สำเร็จ`,
//     html: `
//     <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #7F8C8D; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
//         <div style="padding: 25px; text-align: center; border-bottom: 1px solid #e0e0e0;">
//             <h2 style="color: #34495E; margin: 0;">ยืนยันการนัดหมายสำเร็จ</h2>
//             <p>สวัสดีคุณ ${patientName}, การนัดหมายของคุณได้รับการยืนยันเรียบร้อยแล้ว</p>
//         </div>
//         <div style="padding: 25px;">
//             <h3 style="color: #34495E; margin-top: 0;">รายละเอียดการนัดหมาย:</h3>
//             <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
//                 <p style="margin: 5px 0;"><strong>แพทย์:</strong> ${doctorName}</p>
//                 <p style="margin: 5px 0;"><strong>ผู้ป่วย:</strong> ${patientName}</p>
//                 <p style="margin: 5px 0;"><strong>วันที่นัด:</strong> ${formattedDate}</p>
//                 <p style="margin: 5px 0;"><strong>เวลา:</strong> ${formattedTime} น.</p>
//                 <p style="margin: 5px 0;"><strong>รหัสห้อง Telemedical:</strong> ${telemedicineRoomId}</p>
//             </div>
//             <div style="text-align: center; margin: 30px 0;">
//                 <a href="${telemedicineUrl}" target="_blank" style="background-color: #2D9CDB; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
//                     เข้าห้องตรวจออนไลน์
//                 </a>
//             </div>
//             <p style="font-size: 14px; text-align: center; color: #7F8C8D;">กรุณาเข้าสู่ระบบและไปที่หน้า 'การนัดหมายของฉัน' เพื่อดูรายละเอียดเพิ่มเติม หรือเตรียมตัวล่วงหน้าก่อนถึงเวลานัดหมาย</p>
//         </div>
//         <div style="background-color: #f7f7f7; padding: 20px; text-align: left;">
//             <p style="margin: 0; font-size: 14px;">ขอแสดงความนับถือ,<br>ทีมงาน ทักหมอ</p>
//             <img 
//               src="https://res.cloudinary.com/dhoyopcr7/image/upload/v1753282411/takmor_2_vkivfo.png" 
//               alt="TakMor Logo" 
//               style="width: 120px; height: auto; margin-top: 15px;"
//             >
//         </div>
//     </div>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Appointment confirmation email sent to: ${patientEmail}`);
//   } catch (error) {
//     console.error("Error sending appointment confirmation email:", error);
//     throw new Error("Failed to send appointment confirmation email.");
//   }
// };



export default emailService