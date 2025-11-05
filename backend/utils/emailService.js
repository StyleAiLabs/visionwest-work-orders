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
 * Send welcome email to newly created user with temporary credentials
 * @param {Object} user - User object (must have email, full_name)
 * @param {string} temporaryPassword - Plain text temporary password
 * @returns {Promise<void>}
 */
exports.sendNewUserCredentialsEmail = async (user, temporaryPassword) => {
  // Non-blocking email - don't throw errors
  try {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fromEmail = process.env.EMAIL_USER || 'noreply@nextgenwom.com';
    const fromName = 'NextGen WOM';

    // Brand-compliant HTML template following NextGen WOM brand guidelines
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NextGen WOM</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header: Deep Navy -->
          <div style="background-color: #0e2640; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600;">NextGen WOM</h1>
            <p style="color: #ffffff; font-size: 16px; margin: 8px 0 0 0; opacity: 0.9;">Work Order Management</p>
          </div>

          <!-- Body Content: Rich Black text on Pure White background -->
          <div style="padding: 40px 24px; background-color: #ffffff;">
            <h2 style="color: #010308; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">Welcome!</h2>

            <p style="color: #010308; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${user.full_name},
            </p>

            <p style="color: #010308; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              A client admin has created an account for you in the NextGen Work Order Management system.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f9fafb; border-left: 4px solid #8bc63b; padding: 20px; border-radius: 4px; margin: 0 0 24px 0;">
              <p style="color: #010308; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">YOUR LOGIN CREDENTIALS</p>
              <p style="color: #010308; font-size: 14px; line-height: 1.8; margin: 0;">
                <strong>Email:</strong> ${user.email}<br>
                <strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; color: #010308;">${temporaryPassword}</code>
              </p>
            </div>

            <p style="color: #010308; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <strong style="color: #92400e;">Important:</strong> You will be required to change your password on first login for security.
            </p>

            <!-- CTA Button: NextGen Green -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}/login"
                 style="display: inline-block; background-color: #8bc63b; color: #ffffff; padding: 14px 32px;
                        text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Login to NextGen WOM
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
              If you have any questions or need assistance, please contact your organization's admin.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} NextGen WOM. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try Brevo first, fallback to nodemailer
    if (brevoApiInstance) {
      try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: fromName, email: fromEmail };
        sendSmtpEmail.to = [{ email: user.email, name: user.full_name }];
        sendSmtpEmail.subject = 'Welcome to NextGen WOM - Your Account Credentials';
        sendSmtpEmail.htmlContent = htmlContent;

        await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Credentials email sent via Brevo to ${user.email}`);
      } catch (brevoError) {
        console.warn(`⚠️  Brevo failed, falling back to nodemailer:`, brevoError.message);

        // Fallback to nodemailer
        const mailOptions = {
          from: `${fromName} <${fromEmail}>`,
          to: user.email,
          subject: 'Welcome to NextGen WOM - Your Account Credentials',
          html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Credentials email sent via nodemailer to ${user.email}`);
      }
    } else {
      // Use nodemailer directly if Brevo not initialized
      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: user.email,
        subject: 'Welcome to NextGen WOM - Your Account Credentials',
        html: htmlContent
      };
      await transporter.sendMail(mailOptions);
      console.log(`✅ Credentials email sent via nodemailer to ${user.email}`);
    }

  } catch (error) {
    // Log error but don't throw - email failure should not block user creation
    console.error(`❌ Failed to send credentials email to ${user.email}:`, error.message);
    // Note: Do NOT log the password
  }
};

/**
 * Send email using Brevo template
 * @param {Object} options - Email options
 * @param {number} options.templateId - Brevo template ID
 * @param {Array<{email: string, name?: string}>} options.to - Recipients
 * @param {Object} options.params - Template parameters
 * @param {string} options.subject - Email subject (fallback if template doesn't have one)
 * @returns {Promise<void>}
 */
exports.sendBrevoTemplateEmail = async ({ templateId, to, params = {}, subject = '' }) => {
  try {
    if (!brevoApiInstance) {
      console.warn('⚠️  Brevo API not initialized - skipping email send');
      return null;
    }

    if (!to || to.length === 0) {
      console.warn('⚠️  No recipients provided - skipping email send');
      return null;
    }

    const fromEmail = process.env.EMAIL_USER || 'noreply@nextgenwom.com';
    const fromName = 'NextGen WOM';

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: fromName, email: fromEmail };
    sendSmtpEmail.to = to;
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.params = params;
    
    // Subject is optional if the template already has one
    if (subject) {
      sendSmtpEmail.subject = subject;
    }

    await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Brevo template email sent (template #${templateId}) to ${to.map(r => r.email).join(', ')}`);
  } catch (error) {
    // Log error but don't throw - email failure should not block business operations
    console.error(`❌ Failed to send Brevo template email (template #${templateId}):`, error.message);
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
