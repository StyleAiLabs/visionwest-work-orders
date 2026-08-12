const cron = require('node-cron');
const db = require('../models');
const emailService = require('../utils/emailService');

const QuoteReminder = db.quoteReminder;
const Quote = db.quote;
const { Op } = require('sequelize');

const REMINDER_SCHEDULE = [
    { reminder_number: 1, hours: 4 },
    { reminder_number: 2, hours: 24 }
];

exports.scheduleReminders = async (quote) => {
    try {
        // Cancel any existing pending reminders first (handles re-request scenario)
        await exports.cancelPendingReminders(quote.id);

        const now = new Date();
        const records = REMINDER_SCHEDULE.map(({ reminder_number, hours }) => ({
            quote_id: quote.id,
            reminder_number,
            scheduled_at: new Date(now.getTime() + hours * 60 * 60 * 1000),
            sent_at: null,
            cancelled_at: null,
            created_at: now
        }));

        await QuoteReminder.bulkCreate(records);
        console.log(`✓ Scheduled ${records.length} reminders for quote ${quote.quote_number}`);
    } catch (error) {
        console.error('Error scheduling reminders:', error.message);
    }
};

exports.cancelPendingReminders = async (quoteId) => {
    try {
        const cancelled = await QuoteReminder.update(
            { cancelled_at: new Date() },
            {
                where: {
                    quote_id: quoteId,
                    sent_at: null,
                    cancelled_at: null
                }
            }
        );
        if (cancelled[0] > 0) {
            console.log(`✓ Cancelled ${cancelled[0]} pending reminders for quote ${quoteId}`);
        }
    } catch (error) {
        console.error('Error cancelling reminders:', error.message);
    }
};

const sendReminder = async (reminder) => {
    try {
        const quote = await Quote.findByPk(reminder.quote_id, {
            include: [
                { model: db.client, as: 'client' },
                { model: db.user, as: 'creator', attributes: ['id', 'full_name', 'email'] }
            ]
        });

        if (!quote || quote.status !== 'Information Requested') {
            // Quote no longer needs info — cancel this reminder
            await reminder.update({ cancelled_at: new Date() });
            return;
        }

        // Get all client users to notify
        const clientUsers = await db.user.findAll({
            where: {
                client_id: quote.client_id,
                role: ['client', 'client_admin'],
                is_active: true
            },
            attributes: ['id', 'full_name', 'email']
        });

        if (clientUsers.length === 0) {
            await reminder.update({ cancelled_at: new Date() });
            return;
        }

        const recipients = clientUsers.map(u => ({ email: u.email, name: u.full_name }));

        // Get the original info request message + requesting staff member
        const infoMessage = await db.quoteMessage.findOne({
            where: { quote_id: quote.id, message_type: 'info_requested' },
            order: [['created_at', 'DESC']],
            include: [{ model: db.user, as: 'user', attributes: ['full_name'] }]
        });

        const requestedByName = infoMessage?.user?.full_name || 'Williams Property Services Group';
        const originalMessage = infoMessage?.message || '';
        const reminderLabel = reminder.reminder_number === 1 ? '1st reminder' : '2nd reminder';
        const request_message = `[${reminderLabel} — we have not yet received your response]\n\n${originalMessage}`;

        await emailService.sendBrevoTemplateEmail({
            templateId: 21,
            to: recipients,
            subject: `REMINDER: Quote ${quote.quote_number} - Additional Information Still Needed`,
            params: {
                recipient_name: recipients.map(r => r.name).join(', '),
                quote_number: quote.quote_number,
                property_name: quote.property_name,
                property_address: quote.property_address,
                requested_by_name: requestedByName,
                request_message,
                description: quote.description
            }
        });

        await reminder.update({ sent_at: new Date() });
        console.log(`✓ Sent reminder #${reminder.reminder_number} for quote ${quote.quote_number}`);
    } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error.message);
    }
};

const processDueReminders = async () => {
    try {
        const dueReminders = await QuoteReminder.findAll({
            where: {
                scheduled_at: { [Op.lte]: new Date() },
                sent_at: null,
                cancelled_at: null
            }
        });

        if (dueReminders.length > 0) {
            console.log(`Processing ${dueReminders.length} due quote reminder(s)...`);
            for (const reminder of dueReminders) {
                await sendReminder(reminder);
            }
        }
    } catch (error) {
        console.error('Error processing due reminders:', error.message);
    }
};

exports.startReminderCron = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', processDueReminders);
    console.log('✓ Quote reminder cron started (every 5 minutes)');
};
