const nodemailer = require('nodemailer');
const { AgentBase } = require('./agent-base.cjs');

class VendorOutreachAgent extends AgentBase {
  constructor() {
    super('VendorOutreachAgent', 'Handles automated email communication with vendors for verification and compliance');
    this.emailTemplates = new Map();
    this.outreachQueue = [];
    this.outreachHistory = new Map();
    this.transporter = null;
    this.isInitialized = false;
    
    // Email configuration
    this.config = {
      fromEmail: process.env.VENDOR_OUTREACH_EMAIL || 'compliance@aicomplyr.io',
      fromName: 'AICOMPLYR Compliance Team',
      replyTo: process.env.VENDOR_OUTREACH_REPLY_TO || 'compliance@aicomplyr.io',
      maxRetries: 3,
      retryDelay: 60000, // 1 minute
      maxConcurrentEmails: 5,
      activeEmails: 0
    };
    
    this.initializeEmailTemplates();
  }

  async initialize() {
    try {
      this.log('Initializing Vendor Outreach Agent...');
      
      // Initialize email transporter
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      // Verify connection
      await this.transporter.verify();
      
      this.isInitialized = true;
      this.log('Vendor Outreach Agent initialized successfully');
      
    } catch (error) {
      this.log(`Failed to initialize email transporter: ${error.message}`, 'error');
      throw error;
    }
  }

  initializeEmailTemplates() {
    // Template for initial vendor verification
    this.emailTemplates.set('verification', {
      subject: 'AICOMPLYR: AI Tool Verification Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">AICOMPLYR Compliance Verification</h2>
          <p>Dear {vendorName} Team,</p>
          <p>We are reaching out regarding your AI tool <strong>{toolName}</strong> which has been identified for potential use in our organization.</p>
          <p>To ensure compliance with our AI governance policies, we need to verify the following information:</p>
          <ul>
            <li>Data handling practices and privacy policies</li>
            <li>AI model training data sources</li>
            <li>Compliance with relevant regulations (GDPR, HIPAA, etc.)</li>
            <li>Data retention and deletion policies</li>
            <li>Third-party data sharing practices</li>
          </ul>
          <p>Please review our compliance requirements and respond with the requested information.</p>
          <p><strong>Response Deadline:</strong> {deadline}</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>AICOMPLYR Compliance Team</p>
          <hr>
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated message from AICOMPLYR. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        AICOMPLYR Compliance Verification
        
        Dear {vendorName} Team,
        
        We are reaching out regarding your AI tool {toolName} which has been identified for potential use in our organization.
        
        To ensure compliance with our AI governance policies, we need to verify the following information:
        - Data handling practices and privacy policies
        - AI model training data sources
        - Compliance with relevant regulations (GDPR, HIPAA, etc.)
        - Data retention and deletion policies
        - Third-party data sharing practices
        
        Please review our compliance requirements and respond with the requested information.
        
        Response Deadline: {deadline}
        
        If you have any questions, please don't hesitate to contact us.
        
        Best regards,
        AICOMPLYR Compliance Team
        
        ---
        This is an automated message from AICOMPLYR. Please do not reply to this email.
      `
    });

    // Template for follow-up reminder
    this.emailTemplates.set('followup', {
      subject: 'AICOMPLYR: Follow-up - Compliance Verification Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">AICOMPLYR: Follow-up Required</h2>
          <p>Dear {vendorName} Team,</p>
          <p>This is a follow-up regarding our previous request for compliance verification of your AI tool <strong>{toolName}</strong>.</p>
          <p>We have not yet received a response to our initial request. This verification is critical for our compliance assessment.</p>
          <p><strong>Urgent Response Required by:</strong> {deadline}</p>
          <p>If we do not receive a response by this deadline, we may need to:</p>
          <ul>
            <li>Place your tool on our restricted list</li>
            <li>Escalate to our legal team</li>
            <li>Consider alternative solutions</li>
          </ul>
          <p>Please respond immediately to avoid any delays in our partnership.</p>
          <p>Best regards,<br>AICOMPLYR Compliance Team</p>
          <hr>
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated follow-up message from AICOMPLYR.
          </p>
        </div>
      `,
      text: `
        AICOMPLYR: Follow-up Required
        
        Dear {vendorName} Team,
        
        This is a follow-up regarding our previous request for compliance verification of your AI tool {toolName}.
        
        We have not yet received a response to our initial request. This verification is critical for our compliance assessment.
        
        Urgent Response Required by: {deadline}
        
        If we do not receive a response by this deadline, we may need to:
        - Place your tool on our restricted list
        - Escalate to our legal team
        - Consider alternative solutions
        
        Please respond immediately to avoid any delays in our partnership.
        
        Best regards,
        AICOMPLYR Compliance Team
        
        ---
        This is an automated follow-up message from AICOMPLYR.
      `
    });

    // Template for compliance approval
    this.emailTemplates.set('approval', {
      subject: 'AICOMPLYR: Compliance Verification Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">AICOMPLYR: Compliance Approved</h2>
          <p>Dear {vendorName} Team,</p>
          <p>Great news! Your AI tool <strong>{toolName}</strong> has been approved for use in our organization.</p>
          <p>Our compliance team has reviewed your submission and found it meets our requirements.</p>
          <p><strong>Approval Details:</strong></p>
          <ul>
            <li>Compliance Score: {complianceScore}/100</li>
            <li>Risk Level: {riskLevel}</li>
            <li>Approval Date: {approvalDate}</li>
            <li>Next Review: {nextReviewDate}</li>
          </ul>
          <p>Your tool is now available for use by our teams. We will conduct periodic reviews to ensure continued compliance.</p>
          <p>Thank you for your cooperation in this process.</p>
          <p>Best regards,<br>AICOMPLYR Compliance Team</p>
        </div>
      `,
      text: `
        AICOMPLYR: Compliance Approved
        
        Dear {vendorName} Team,
        
        Great news! Your AI tool {toolName} has been approved for use in our organization.
        
        Our compliance team has reviewed your submission and found it meets our requirements.
        
        Approval Details:
        - Compliance Score: {complianceScore}/100
        - Risk Level: {riskLevel}
        - Approval Date: {approvalDate}
        - Next Review: {nextReviewDate}
        
        Your tool is now available for use by our teams. We will conduct periodic reviews to ensure continued compliance.
        
        Thank you for your cooperation in this process.
        
        Best regards,
        AICOMPLYR Compliance Team
      `
    });

    // Template for compliance rejection
    this.emailTemplates.set('rejection', {
      subject: 'AICOMPLYR: Compliance Verification - Additional Information Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">AICOMPLYR: Additional Information Required</h2>
          <p>Dear {vendorName} Team,</p>
          <p>Thank you for your response regarding our compliance verification request for <strong>{toolName}</strong>.</p>
          <p>After reviewing your submission, we require additional information to complete our compliance assessment.</p>
          <p><strong>Issues Identified:</strong></p>
          <ul>
            {issues}
          </ul>
          <p><strong>Required Actions:</strong></p>
          <ul>
            {actions}
          </ul>
          <p><strong>Response Deadline:</strong> {deadline}</p>
          <p>Please provide the requested information to avoid delays in our approval process.</p>
          <p>If you have any questions, please contact our compliance team.</p>
          <p>Best regards,<br>AICOMPLYR Compliance Team</p>
        </div>
      `,
      text: `
        AICOMPLYR: Additional Information Required
        
        Dear {vendorName} Team,
        
        Thank you for your response regarding our compliance verification request for {toolName}.
        
        After reviewing your submission, we require additional information to complete our compliance assessment.
        
        Issues Identified:
        {issues}
        
        Required Actions:
        {actions}
        
        Response Deadline: {deadline}
        
        Please provide the requested information to avoid delays in our approval process.
        
        If you have any questions, please contact our compliance team.
        
        Best regards,
        AICOMPLYR Compliance Team
      `
    });
  }

  async sendVendorEmail(outreachRequest) {
    if (!this.isInitialized) {
      throw new Error('Vendor Outreach Agent not initialized');
    }

    try {
      this.log(`Sending email to vendor: ${outreachRequest.vendorEmail}`);
      
      const outreachId = this.generateOutreachId(outreachRequest);
      const startTime = Date.now();
      
      // Add to queue if at capacity
      if (this.activeEmails >= this.config.maxConcurrentEmails) {
        this.outreachQueue.push({ ...outreachRequest, outreachId });
        return {
          outreachId,
          status: 'queued',
          message: 'Email queued due to capacity limits'
        };
      }
      
      this.activeEmails++;
      
      try {
        const emailResult = await this.sendEmail(outreachRequest);
        
        const result = {
          outreachId,
          vendorEmail: outreachRequest.vendorEmail,
          vendorName: outreachRequest.vendorName,
          toolName: outreachRequest.toolName,
          emailType: outreachRequest.emailType,
          status: 'sent',
          sentAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          emailId: emailResult.messageId,
          metadata: {
            template: outreachRequest.emailType,
            subject: emailResult.subject
          }
        };
        
        this.outreachHistory.set(outreachId, result);
        this.log(`Email sent successfully to ${outreachRequest.vendorEmail}`);
        
        return result;
        
      } finally {
        this.activeEmails--;
        this.processQueue();
      }
      
    } catch (error) {
      this.log(`Error sending email to ${outreachRequest.vendorEmail}: ${error.message}`, 'error');
      
      const result = {
        outreachId: this.generateOutreachId(outreachRequest),
        vendorEmail: outreachRequest.vendorEmail,
        vendorName: outreachRequest.vendorName,
        toolName: outreachRequest.toolName,
        emailType: outreachRequest.emailType,
        status: 'failed',
        error: error.message,
        sentAt: new Date().toISOString()
      };
      
      this.outreachHistory.set(result.outreachId, result);
      return result;
    }
  }

  async sendEmail(outreachRequest) {
    const template = this.emailTemplates.get(outreachRequest.emailType);
    if (!template) {
      throw new Error(`Email template not found: ${outreachRequest.emailType}`);
    }
    
    // Prepare email content
    const emailContent = this.prepareEmailContent(template, outreachRequest);
    
    // Send email
    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: outreachRequest.vendorEmail,
      replyTo: this.config.replyTo,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };
    
    const result = await this.transporter.sendMail(mailOptions);
    
    return {
      messageId: result.messageId,
      subject: emailContent.subject
    };
  }

  prepareEmailContent(template, outreachRequest) {
    let subject = template.subject;
    let html = template.html;
    let text = template.text;
    
    // Replace placeholders with actual values
    const replacements = {
      '{vendorName}': outreachRequest.vendorName || 'Vendor',
      '{toolName}': outreachRequest.toolName || 'AI Tool',
      '{deadline}': outreachRequest.deadline || '7 days',
      '{complianceScore}': outreachRequest.complianceScore || 'N/A',
      '{riskLevel}': outreachRequest.riskLevel || 'N/A',
      '{approvalDate}': outreachRequest.approvalDate || new Date().toLocaleDateString(),
      '{nextReviewDate}': outreachRequest.nextReviewDate || '6 months',
      '{issues}': this.formatIssues(outreachRequest.issues),
      '{actions}': this.formatActions(outreachRequest.actions)
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      subject = subject.replace(placeholder, value);
      html = html.replace(placeholder, value);
      text = text.replace(placeholder, value);
    }
    
    return { subject, html, text };
  }

  formatIssues(issues) {
    if (!issues || !Array.isArray(issues)) {
      return '<li>No specific issues identified</li>';
    }
    
    return issues.map(issue => `<li>${issue}</li>`).join('');
  }

  formatActions(actions) {
    if (!actions || !Array.isArray(actions)) {
      return '<li>Provide additional compliance documentation</li>';
    }
    
    return actions.map(action => `<li>${action}</li>`).join('');
  }

  async sendVerificationRequest(vendorInfo, toolInfo) {
    const outreachRequest = {
      vendorEmail: vendorInfo.email,
      vendorName: vendorInfo.name,
      toolName: toolInfo.name,
      emailType: 'verification',
      deadline: this.calculateDeadline(7), // 7 days from now
      toolUrl: toolInfo.url,
      complianceRequirements: toolInfo.complianceRequirements || []
    };
    
    return await this.sendVendorEmail(outreachRequest);
  }

  async sendFollowUpReminder(vendorInfo, toolInfo, daysSinceFirstContact) {
    const outreachRequest = {
      vendorEmail: vendorInfo.email,
      vendorName: vendorInfo.name,
      toolName: toolInfo.name,
      emailType: 'followup',
      deadline: this.calculateDeadline(3), // 3 days from now
      daysSinceFirstContact,
      urgency: daysSinceFirstContact > 14 ? 'high' : 'medium'
    };
    
    return await this.sendVendorEmail(outreachRequest);
  }

  async sendApprovalNotification(vendorInfo, toolInfo, complianceData) {
    const outreachRequest = {
      vendorEmail: vendorInfo.email,
      vendorName: vendorInfo.name,
      toolName: toolInfo.name,
      emailType: 'approval',
      complianceScore: complianceData.score,
      riskLevel: complianceData.riskLevel,
      approvalDate: new Date().toLocaleDateString(),
      nextReviewDate: this.calculateNextReviewDate(complianceData.riskLevel)
    };
    
    return await this.sendVendorEmail(outreachRequest);
  }

  async sendRejectionNotification(vendorInfo, toolInfo, complianceIssues, requiredActions) {
    const outreachRequest = {
      vendorEmail: vendorInfo.email,
      vendorName: vendorInfo.name,
      toolName: toolInfo.name,
      emailType: 'rejection',
      issues: complianceIssues,
      actions: requiredActions,
      deadline: this.calculateDeadline(10) // 10 days to respond
    };
    
    return await this.sendVendorEmail(outreachRequest);
  }

  calculateDeadline(days) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toLocaleDateString();
  }

  calculateNextReviewDate(riskLevel) {
    const reviewIntervals = {
      'low': 12, // 12 months
      'medium': 6, // 6 months
      'high': 3 // 3 months
    };
    
    const months = reviewIntervals[riskLevel] || 6;
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + months);
    return nextReview.toLocaleDateString();
  }

  async processQueue() {
    if (this.outreachQueue.length === 0 || this.activeEmails >= this.config.maxConcurrentEmails) {
      return;
    }
    
    const nextOutreach = this.outreachQueue.shift();
    if (nextOutreach) {
      this.log(`Processing queued outreach: ${nextOutreach.vendorEmail}`);
      this.sendVendorEmail(nextOutreach);
    }
  }

  generateOutreachId(outreachRequest) {
    const input = `${outreachRequest.vendorEmail}-${outreachRequest.toolName}-${outreachRequest.emailType}`;
    return `outreach-${Buffer.from(input).toString('base64').substring(0, 8)}`;
  }

  async getOutreachHistory(limit = 50) {
    const history = Array.from(this.outreachHistory.values());
    return history
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, limit);
  }

  async getOutreachById(outreachId) {
    return this.outreachHistory.get(outreachId) || null;
  }

  async retryFailedOutreach(outreachId) {
    const outreach = this.outreachHistory.get(outreachId);
    if (!outreach || outreach.status !== 'failed') {
      throw new Error('Outreach not found or not failed');
    }
    
    // Reconstruct outreach request
    const outreachRequest = {
      vendorEmail: outreach.vendorEmail,
      vendorName: outreach.vendorName,
      toolName: outreach.toolName,
      emailType: outreach.emailType
    };
    
    return await this.sendVendorEmail(outreachRequest);
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeEmails: this.activeEmails,
      queueLength: this.outreachQueue.length,
      totalOutreach: this.outreachHistory.size,
      maxConcurrent: this.config.maxConcurrentEmails
    };
  }

  async cleanup() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
    this.isInitialized = false;
    this.log('Vendor Outreach Agent cleaned up');
  }
}

module.exports = VendorOutreachAgent;
