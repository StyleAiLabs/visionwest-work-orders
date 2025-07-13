const puppeteer = require('puppeteer');
const db = require('../models');
const { Op } = require('sequelize');

class PDFService {
    static async generateWorkOrderPDF(workOrderId) {
        let browser = null;
        try {
            console.log(`Generating PDF for work order ID: ${workOrderId}`);
            
            // Fetch all work order data with related tables
            const workOrder = await db.workOrder.findByPk(workOrderId, {
                include: [
                    {
                        model: db.photo,
                        as: 'photos',
                        required: false
                    },
                    {
                        model: db.workOrderNote,
                        as: 'notes',
                        required: false
                    },
                    {
                        model: db.statusUpdate,
                        as: 'statusUpdates',
                        required: false
                    }
                ]
            });

            if (!workOrder) {
                throw new Error(`Work order with ID ${workOrderId} not found`);
            }

            console.log(`Found work order: ${workOrder.job_no}`);

            // Generate HTML content for PDF
            const htmlContent = this.generateHTML(workOrder);
            console.log('HTML content generated successfully');

            // Create PDF using Puppeteer with better error handling
            try {
                browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process'
                    ]
                });
                console.log('Puppeteer browser launched successfully');

                const page = await browser.newPage();
                await page.setContent(htmlContent, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000 
                });
                console.log('HTML content loaded into page');

                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: {
                        top: '20mm',
                        right: '15mm',
                        bottom: '20mm',
                        left: '15mm'
                    }
                });
                console.log('PDF generated successfully');

                return pdfBuffer;
            } catch (puppeteerError) {
                console.error('Puppeteer error:', puppeteerError);
                throw new Error(`PDF generation failed: ${puppeteerError.message}`);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        } finally {
            if (browser) {
                try {
                    await browser.close();
                    console.log('Browser closed successfully');
                } catch (closeError) {
                    console.error('Error closing browser:', closeError);
                }
            }
        }
    }

    static generateHTML(workOrder) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount || 0);
        };

        const getStatusColor = (status) => {
            const colors = {
                'Pending': '#f59e0b',
                'In Progress': '#3b82f6',
                'Completed': '#10b981',
                'Cancelled': '#ef4444'
            };
            return colors[status] || '#6b7280';
        };

        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Work Order #${workOrder.job_no}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
          }
          
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          }
          
          .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
          }
          
          .content {
            padding: 0 30px;
          }
          
          .section {
            margin-bottom: 30px;
            break-inside: avoid;
          }
          
          .section h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .info-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 16px;
            color: #1f2937;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            color: white;
            background-color: ${getStatusColor(workOrder.status)};
          }
          
          .description {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin-bottom: 20px;
          }
          
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          
          .photo-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          
          .photo-placeholder {
            width: 100%;
            height: 150px;
            background: #e5e7eb;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .note-item, .status-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #8b5cf6;
          }
          
          .note-header, .status-header {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .note-content, .status-content {
            color: #1f2937;
            line-height: 1.5;
          }
          
          .footer {
            margin-top: 40px;
            padding: 20px 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Work Order #${workOrder.job_no}</h1>
          <p>Generated on ${formatDate(new Date())}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Work Order Details</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge">${workOrder.status}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Work Order Type</div>
                <div class="info-value">${workOrder.work_order_type || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Created Date</div>
                <div class="info-value">${formatDate(workOrder.createdAt)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Last Updated</div>
                <div class="info-value">${formatDate(workOrder.updatedAt)}</div>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">PO Number</div>
                <div class="info-value">${workOrder.po_number || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${formatDate(workOrder.date)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Property Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Property Name</div>
                <div class="info-value">${workOrder.property_name || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Property Address</div>
                <div class="info-value">${workOrder.property_address || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Property Phone</div>
                <div class="info-value">${workOrder.property_phone || 'Not specified'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Supplier Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Supplier Name</div>
                <div class="info-value">${workOrder.supplier_name || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Supplier Phone</div>
                <div class="info-value">${workOrder.supplier_phone || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Supplier Email</div>
                <div class="info-value">${workOrder.supplier_email || 'Not specified'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Authorization</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Authorized By</div>
                <div class="info-value">${workOrder.authorized_by || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Authorized Contact</div>
                <div class="info-value">${workOrder.authorized_contact || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Authorized Email</div>
                <div class="info-value">${workOrder.authorized_email || 'Not specified'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Work Description</h2>
            <div class="description">
              ${workOrder.description || 'No description provided.'}
            </div>
          </div>
          
          ${workOrder.photos && workOrder.photos.length > 0 ? `
          <div class="section">
            <h2>Photos (${workOrder.photos.length})</h2>
            <div class="photos-grid">
              ${workOrder.photos.map(photo => `
                <div class="photo-item">
                  <div class="photo-placeholder">
                    📷 Photo Available
                  </div>
                  <div style="font-size: 12px; color: #6b7280;">
                    ${photo.description || 'No description'}
                  </div>
                  <div style="font-size: 11px; color: #9ca3af;">
                    ${formatDate(photo.createdAt)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${workOrder.notes && workOrder.notes.length > 0 ? `
          <div class="section">
            <h2>Notes & Comments (${workOrder.notes.length})</h2>
            ${workOrder.notes.map(note => `
              <div class="note-item">
                <div class="note-header">
                  Note • ${formatDate(note.createdAt)}
                </div>
                <div class="note-content">${note.content}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${workOrder.statusUpdates && workOrder.statusUpdates.length > 0 ? `
          <div class="section">
            <h2>Status History (${workOrder.statusUpdates.length})</h2>
            ${workOrder.statusUpdates.map(update => `
              <div class="status-item">
                <div class="status-header">
                  Status changed to "${update.new_status}" • ${formatDate(update.createdAt)}
                </div>
                ${update.notes ? `<div class="status-content">${update.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>VisionWest Work Order Management System</p>
          <p>This document contains confidential information and is intended for authorized personnel only.</p>
        </div>
      </body>
      </html>
    `;
    }
}

module.exports = PDFService;
