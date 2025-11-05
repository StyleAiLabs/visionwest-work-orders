/**
 * Test Script for Quote Email Notifications
 * 
 * This script tests all 8 Brevo email notification scenarios:
 * 1. Quote Submitted (Template #17)
 * 2. Quote Provided (Template #18)
 * 3. Quote Approved (Template #19)
 * 4. Quote Declined by Client (Template #20)
 * 5. More Information Requested (Template #21)
 * 6. Quote Converted to Work Order (Template #22)
 * 7. Quote Expiring Soon (Template #23)
 * 8. Quote Expired (Template #24)
 * 
 * Usage: node scripts/test-quote-emails.js [scenario_number]
 * Example: node scripts/test-quote-emails.js 1
 * Or run all: node scripts/test-quote-emails.js all
 */

require('dotenv').config();
const emailService = require('../utils/emailService');

// Test recipient
const TEST_RECIPIENT = {
    email: 'gayan.c@outlook.com',
    name: 'Gayan Hewage'
};

// Mock quote data for testing
const mockQuote = {
    id: 999,
    quote_number: 'QTE-2025-TEST',
    property_name: 'Test Property - 123 Main Street',
    property_address: '123 Main Street, Auckland, New Zealand',
    description: 'Test quote for email notification system. This is a sample description of the work required.',
    estimated_cost: '1250.00',
    estimated_hours: '8.5',
    quote_notes: 'This is a test quote note. Materials included in the quote.',
    quote_valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    is_urgent: true,
    contact_person: 'John Smith',
    contact_email: 'john.smith@example.com',
    contact_phone: '021-123-4567',
    required_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    created_at: new Date(),
    quoted_at: new Date(),
    approved_at: new Date(),
    declined_at: new Date(),
    decline_reason: 'Budget constraints - please revise the quote with alternative options',
    client_id: 1
};

const mockUser = {
    full_name: 'Test User',
    email: 'test.user@example.com',
    role: 'client_admin'
};

const mockWorkOrder = {
    id: 888,
    job_no: 'WO-2025-TEST-001'
};

/**
 * Test Scenario 1: Quote Submitted to WPSG Staff
 */
async function testQuoteSubmitted() {
    console.log('\n📧 Testing Scenario 1: Quote Submitted (Template #17)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 17,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                submitted_by: mockUser.full_name,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                description: mockQuote.description,
                is_urgent: mockQuote.is_urgent ? 'Yes' : 'No',
                contact_person: mockQuote.contact_person,
                contact_email: mockQuote.contact_email,
                contact_phone: mockQuote.contact_phone,
                required_by_date: mockQuote.required_by_date.toLocaleDateString()
            }
        });
        console.log('✅ Quote Submitted email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 2: Quote Provided to Client Admin
 */
async function testQuoteProvided() {
    console.log('\n📧 Testing Scenario 2: Quote Provided (Template #18)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 18,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                provided_by_name: 'Williams Property Staff',
                quote_number: mockQuote.quote_number,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                estimated_hours: parseFloat(mockQuote.estimated_hours).toFixed(1),
                quote_notes: mockQuote.quote_notes,
                quote_valid_until: mockQuote.quote_valid_until.toLocaleDateString(),
                description: mockQuote.description
            }
        });
        console.log('✅ Quote Provided email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 3: Quote Approved - Notify WPSG Staff
 */
async function testQuoteApproved() {
    console.log('\n📧 Testing Scenario 3: Quote Approved (Template #19)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 19,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                approved_by_name: mockUser.full_name,
                client_name: 'VisionWest Community Trust',
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                estimated_hours: parseFloat(mockQuote.estimated_hours).toFixed(1),
                description: mockQuote.description
            }
        });
        console.log('✅ Quote Approved email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 4: Quote Declined by Client - Notify WPSG Staff
 */
async function testQuoteDeclined() {
    console.log('\n📧 Testing Scenario 4: Quote Declined by Client (Template #20)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 20,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                declined_by_name: mockUser.full_name,
                client_name: 'VisionWest Community Trust',
                decline_reason: mockQuote.decline_reason,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                description: mockQuote.description
            }
        });
        console.log('✅ Quote Declined email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 5: More Information Requested - Notify Client Admin
 */
async function testInfoRequested() {
    console.log('\n📧 Testing Scenario 5: More Information Requested (Template #21)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 21,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                requested_by_name: 'Williams Property Staff',
                request_message: 'We need additional information about the scope of work. Could you please clarify if the work includes all exterior walls or just the front section?',
                description: mockQuote.description
            }
        });
        console.log('✅ Info Requested email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 6: Quote Converted to Work Order - Notify Client Admin
 */
async function testQuoteConverted() {
    console.log('\n📧 Testing Scenario 6: Quote Converted to Work Order (Template #22)');
    console.log('━'.repeat(60));

    try {
        await emailService.sendBrevoTemplateEmail({
            templateId: 22,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                work_order_number: mockWorkOrder.job_no,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                description: mockQuote.description,
                converted_by: 'Williams Property Staff'
            }
        });
        console.log('✅ Quote Converted email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 7: Quote Expiring Soon - Notify Client Admin
 */
async function testQuoteExpiring() {
    console.log('\n📧 Testing Scenario 7: Quote Expiring Soon (Template #23)');
    console.log('━'.repeat(60));

    try {
        const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

        await emailService.sendBrevoTemplateEmail({
            templateId: 23,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                quote_valid_until: expiryDate.toLocaleDateString(),
                days_until_expiry: '3',
                description: mockQuote.description
            }
        });
        console.log('✅ Quote Expiring Soon email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Test Scenario 8: Quote Expired - Notify Client Admin
 */
async function testQuoteExpired() {
    console.log('\n📧 Testing Scenario 8: Quote Expired (Template #24)');
    console.log('━'.repeat(60));

    try {
        const expiredDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // Yesterday

        await emailService.sendBrevoTemplateEmail({
            templateId: 24,
            to: [TEST_RECIPIENT],
            params: {
                recipient_name: TEST_RECIPIENT.name,
                quote_number: mockQuote.quote_number,
                property_name: mockQuote.property_name,
                property_address: mockQuote.property_address,
                estimated_cost: `$${parseFloat(mockQuote.estimated_cost).toFixed(2)}`,
                expired_date: expiredDate.toLocaleDateString(),
                description: mockQuote.description
            }
        });
        console.log('✅ Quote Expired email sent successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

/**
 * Run all tests sequentially with delays
 */
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Quote Email Notification Test Suite                      ║');
    console.log('║  Testing all 8 scenarios with Brevo Templates #17-24      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📬 Test recipient: ${TEST_RECIPIENT.email}`);
    console.log(`📅 Test date: ${new Date().toLocaleString()}`);

    const tests = [
        { name: 'Quote Submitted', fn: testQuoteSubmitted },
        { name: 'Quote Provided', fn: testQuoteProvided },
        { name: 'Quote Approved', fn: testQuoteApproved },
        { name: 'Quote Declined', fn: testQuoteDeclined },
        { name: 'Info Requested', fn: testInfoRequested },
        { name: 'Quote Converted', fn: testQuoteConverted },
        { name: 'Quote Expiring Soon', fn: testQuoteExpiring },
        { name: 'Quote Expired', fn: testQuoteExpired }
    ];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tests.length; i++) {
        try {
            await tests[i].fn();
            successCount++;

            // Add delay between emails to avoid rate limiting
            if (i < tests.length - 1) {
                console.log('⏳ Waiting 2 seconds before next test...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            failCount++;
            console.error(`❌ ${tests[i].name} failed:`, error.message);
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Test Summary:');
    console.log(`   ✅ Successful: ${successCount}/${tests.length}`);
    console.log(`   ❌ Failed: ${failCount}/${tests.length}`);
    console.log('═'.repeat(60));

    if (successCount === tests.length) {
        console.log('\n🎉 All email tests passed! Check your inbox at gayan.c@outlook.com');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
}

/**
 * Main execution
 */
async function main() {
    const scenario = process.argv[2];

    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY) {
        console.error('❌ Error: BREVO_API_KEY not found in environment variables');
        console.error('Please add BREVO_API_KEY to your .env file');
        process.exit(1);
    }

    if (!scenario) {
        console.log('\n📖 Usage:');
        console.log('  node scripts/test-quote-emails.js [scenario]');
        console.log('\n📋 Available scenarios:');
        console.log('  1  - Quote Submitted (Template #17)');
        console.log('  2  - Quote Provided (Template #18)');
        console.log('  3  - Quote Approved (Template #19)');
        console.log('  4  - Quote Declined by Client (Template #20)');
        console.log('  5  - More Information Requested (Template #21)');
        console.log('  6  - Quote Converted to Work Order (Template #22)');
        console.log('  7  - Quote Expiring Soon (Template #23)');
        console.log('  8  - Quote Expired (Template #24)');
        console.log('  all - Run all scenarios');
        console.log('\n💡 Example: node scripts/test-quote-emails.js 1');
        console.log('           node scripts/test-quote-emails.js all\n');
        process.exit(0);
    }

    try {
        switch (scenario) {
            case '1':
                await testQuoteSubmitted();
                break;
            case '2':
                await testQuoteProvided();
                break;
            case '3':
                await testQuoteApproved();
                break;
            case '4':
                await testQuoteDeclined();
                break;
            case '5':
                await testInfoRequested();
                break;
            case '6':
                await testQuoteConverted();
                break;
            case '7':
                await testQuoteExpiring();
                break;
            case '8':
                await testQuoteExpired();
                break;
            case 'all':
                await runAllTests();
                break;
            default:
                console.error(`❌ Invalid scenario: ${scenario}`);
                console.log('Use: 1, 2, 3, 4, 5, 6, 7, 8, or "all"');
                process.exit(1);
        }

        console.log('\n✨ Test execution completed!\n');
    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run the script
main();
