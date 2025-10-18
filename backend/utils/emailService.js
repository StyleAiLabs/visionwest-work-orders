const nodemailer = require('nodemailer');
const Brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let brevoApiInstance = null;
if (process.env.BREVO_API_KEY) {
  brevoApiInstance = new Brevo.TransactionalEmailsApi();
  brevoApiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  console.log('📧 Brevo email service initialized');
} else {
  console.warn('⚠️  BREVO_API_KEY not found - will fall back to nodemailer');
}

// Create reusable transporter with SMTP configuration from environment (fallback)
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
  // Non-blocking email - don't throw errors
  try {
    // Build recipient list from environment variables
    const recipients = [];
    if (process.env.EMAIL_NOTIFICATION_RECIPIENT) {
      recipients.push(process.env.EMAIL_NOTIFICATION_RECIPIENT);
    }
    if (process.env.EMAIL_NOTIFICATION_RECIPIENT_2) {
      recipients.push(process.env.EMAIL_NOTIFICATION_RECIPIENT_2);
    }

    // Skip sending if no recipients configured
    if (recipients.length === 0) {
      console.warn('⚠️  No email recipients configured (EMAIL_NOTIFICATION_RECIPIENT, EMAIL_NOTIFICATION_RECIPIENT_2)');
      return null;
    }

    const fromEmail = process.env.EMAIL_USER || 'noreply@nextgenwom.com';
    const fromName = 'NextGen WOM';
    const subject = `New Work Order Created - ${workOrder.job_no}`;

    const htmlContent = `
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
    `;

    // Try Brevo first, fallback to nodemailer
    if (brevoApiInstance) {
      try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: fromName, email: fromEmail };
        sendSmtpEmail.to = recipients.map(email => ({ email: email.trim() }));
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;

        await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Work order notification email sent via Brevo to ${recipients.join(', ')}`);
      } catch (brevoError) {
        console.warn(`⚠️  Brevo failed, falling back to nodemailer:`, brevoError.message);

        // Fallback to nodemailer
        const mailOptions = {
          from: `${fromName} <${fromEmail}>`,
          to: recipients.join(', '),
          subject: subject,
          html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Work order notification email sent via nodemailer to ${recipients.join(', ')}`);
      }
    } else {
      // Use nodemailer directly if Brevo not initialized
      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: recipients.join(', '),
        subject: subject,
        html: htmlContent
      };
      await transporter.sendMail(mailOptions);
      console.log(`✅ Work order notification email sent via nodemailer to ${recipients.join(', ')}`);
    }

  } catch (error) {
    // Log error but don't throw - email failure should not block work order creation
    console.error(`❌ Failed to send work order notification email:`, error.message);
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
