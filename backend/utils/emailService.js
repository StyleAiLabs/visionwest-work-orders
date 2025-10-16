const nodemailer = require('nodemailer');

// Create reusable transporter with SMTP configuration from environment
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email notification when a new work order is manually created
 * @param {Object} workOrder - The created work order object
 * @param {Object} createdBy - The user who created the work order
 * @returns {Promise<void>}
 */
exports.sendWorkOrderCreatedEmail = async (workOrder, createdBy) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_NOTIFICATION_RECIPIENT,
      subject: `New Work Order Created - ${workOrder.job_no}`,
      html: `
        <h2>New Work Order Created (Manual Entry)</h2>
        <p><strong>Job Number:</strong> ${workOrder.job_no}</p>
        <p><strong>Property:</strong> ${workOrder.property_name}</p>
        <p><strong>Property Address:</strong> ${workOrder.property_address || 'N/A'}</p>
        <p><strong>Supplier:</strong> ${workOrder.supplier_name}</p>
        <p><strong>Supplier Phone:</strong> ${workOrder.supplier_phone || 'N/A'}</p>
        <p><strong>Supplier Email:</strong> ${workOrder.supplier_email || 'N/A'}</p>
        <p><strong>Description:</strong> ${workOrder.description}</p>
        <p><strong>PO Number:</strong> ${workOrder.po_number || 'N/A'}</p>
        <p><strong>Created By:</strong> ${createdBy.full_name} (${createdBy.email})</p>
        <p><strong>Date:</strong> ${workOrder.date}</p>
        <p><strong>Status:</strong> ${workOrder.status}</p>
        <hr>
        <p><em>This work order was manually created in the system.</em></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Work order email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send work order email:', error);
    // Don't throw - email failure shouldn't block work order creation
    return null;
  }
};

/**
 * Verify email configuration is correct
 * @returns {Promise<boolean>}
 */
exports.verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
};
