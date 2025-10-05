const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { AgentBase } = require('./agent-base.cjs');

class DataExtractionAgent extends AgentBase {
  constructor() {
    super('DataExtractionAgent', 'Extracts data from vendor websites and Terms of Service');
    this.extractionQueue = [];
    this.extractionResults = new Map();
    this.browser = null;
    this.maxConcurrentExtractions = 3;
    this.activeExtractions = 0;
  }

  async initialize() {
    try {
      this.log('Initializing Data Extraction Agent...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.log('Data Extraction Agent initialized successfully');
    } catch (error) {
      this.log(`Failed to initialize browser: ${error.message}`, 'error');
      throw error;
    }
  }

  async extractVendorData(vendorUrl, extractionType = 'full') {
    try {
      this.log(`Starting data extraction for: ${vendorUrl}`);
      
      const extractionId = this.generateExtractionId(vendorUrl);
      const startTime = Date.now();
      
      // Add to queue if at capacity
      if (this.activeExtractions >= this.maxConcurrentExtractions) {
        this.extractionQueue.push({ vendorUrl, extractionType, extractionId });
        return {
          extractionId,
          status: 'queued',
          message: 'Extraction queued due to capacity limits'
        };
      }
      
      this.activeExtractions++;
      
      let extractionResult;
      
      try {
        switch (extractionType) {
          case 'tos':
            extractionResult = await this.extractTermsOfService(vendorUrl);
            break;
          case 'privacy':
            extractionResult = await this.extractPrivacyPolicy(vendorUrl);
            break;
          case 'features':
            extractionResult = await this.extractProductFeatures(vendorUrl);
            break;
          case 'full':
          default:
            extractionResult = await this.extractFullWebsite(vendorUrl);
            break;
        }
        
        const processingTime = Date.now() - startTime;
        
        const result = {
          extractionId,
          vendorUrl,
          extractionType,
          status: 'completed',
          processingTime,
          extractedAt: new Date().toISOString(),
          data: extractionResult,
          metadata: {
            userAgent: 'AICOMPLYR-DataExtraction/1.0',
            extractionMethod: extractionType === 'full' ? 'comprehensive' : 'targeted'
          }
        };
        
        this.extractionResults.set(extractionId, result);
        this.log(`Extraction completed for ${vendorUrl} in ${processingTime}ms`);
        
        return result;
        
      } finally {
        this.activeExtractions--;
        this.processQueue();
      }
      
    } catch (error) {
      this.log(`Error during data extraction for ${vendorUrl}: ${error.message}`, 'error');
      
      const result = {
        extractionId: this.generateExtractionId(vendorUrl),
        vendorUrl,
        extractionType,
        status: 'failed',
        error: error.message,
        extractedAt: new Date().toISOString()
      };
      
      this.extractionResults.set(result.extractionId, result);
      return result;
    }
  }

  async extractTermsOfService(vendorUrl) {
    try {
      this.log(`Extracting Terms of Service from: ${vendorUrl}`);
      
      const page = await this.browser.newPage();
      await page.setUserAgent('AICOMPLYR-DataExtraction/1.0');
      
      // Navigate to the main page first
      await page.goto(vendorUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Look for ToS links
      const tosLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(link => {
            const text = link.textContent.toLowerCase();
            const href = link.href.toLowerCase();
            return text.includes('terms') || 
                   text.includes('tos') || 
                   text.includes('conditions') ||
                   href.includes('terms') || 
                   href.includes('tos') ||
                   href.includes('conditions');
          })
          .map(link => ({
            text: link.textContent.trim(),
            href: link.href
          }));
      });
      
      if (tosLinks.length === 0) {
        await page.close();
        return {
          tosFound: false,
          message: 'No Terms of Service links found'
        };
      }
      
      // Extract ToS from the first found link
      const tosUrl = tosLinks[0].href;
      this.log(`Found ToS at: ${tosUrl}`);
      
      await page.goto(tosUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract the content
      const tosContent = await page.evaluate(() => {
        // Try to find the main content area
        const selectors = [
          'main', '.content', '.main-content', '.terms-content',
          '.legal-content', 'article', '.tos-content'
        ];
        
        let content = '';
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            content = element.textContent;
            break;
          }
        }
        
        // Fallback to body if no specific content area found
        if (!content) {
          content = document.body.textContent;
        }
        
        return content.trim();
      });
      
      await page.close();
      
      // Analyze the ToS content
      const analysis = this.analyzeTosContent(tosContent);
      
      return {
        tosFound: true,
        tosUrl,
        content: tosContent.substring(0, 1000) + (tosContent.length > 1000 ? '...' : ''),
        fullContentLength: tosContent.length,
        analysis,
        links: tosLinks
      };
      
    } catch (error) {
      this.log(`Error extracting ToS from ${vendorUrl}: ${error.message}`, 'error');
      throw error;
    }
  }

  async extractPrivacyPolicy(vendorUrl) {
    try {
      this.log(`Extracting Privacy Policy from: ${vendorUrl}`);
      
      const page = await this.browser.newPage();
      await page.setUserAgent('AICOMPLYR-DataExtraction/1.0');
      
      await page.goto(vendorUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Look for Privacy Policy links
      const privacyLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(link => {
            const text = link.textContent.toLowerCase();
            const href = link.href.toLowerCase();
            return text.includes('privacy') || 
                   text.includes('privacy policy') || 
                   href.includes('privacy');
          })
          .map(link => ({
            text: link.textContent.trim(),
            href: link.href
          }));
      });
      
      if (privacyLinks.length === 0) {
        await page.close();
        return {
          privacyFound: false,
          message: 'No Privacy Policy links found'
        };
      }
      
      const privacyUrl = privacyLinks[0].href;
      await page.goto(privacyUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const privacyContent = await page.evaluate(() => {
        const selectors = [
          'main', '.content', '.main-content', '.privacy-content',
          '.legal-content', 'article', '.policy-content'
        ];
        
        let content = '';
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            content = element.textContent;
            break;
          }
        }
        
        if (!content) {
          content = document.body.textContent;
        }
        
        return content.trim();
      });
      
      await page.close();
      
      const analysis = this.analyzePrivacyContent(privacyContent);
      
      return {
        privacyFound: true,
        privacyUrl,
        content: privacyContent.substring(0, 1000) + (privacyContent.length > 1000 ? '...' : ''),
        fullContentLength: privacyContent.length,
        analysis,
        links: privacyLinks
      };
      
    } catch (error) {
      this.log(`Error extracting Privacy Policy from ${vendorUrl}: ${error.message}`, 'error');
      throw error;
    }
  }

  async extractProductFeatures(vendorUrl) {
    try {
      this.log(`Extracting product features from: ${vendorUrl}`);
      
      const page = await this.browser.newPage();
      await page.setUserAgent('AICOMPLYR-DataExtraction/1.0');
      
      await page.goto(vendorUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract product information
      const productInfo = await page.evaluate(() => {
        const features = [];
        const pricing = [];
        const integrations = [];
        
        // Extract features from common selectors
        const featureSelectors = [
          '.feature', '.benefit', '.capability', '.functionality',
          '[class*="feature"]', '[class*="benefit"]'
        ];
        
        featureSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 10) {
              features.push(text);
            }
          });
        });
        
        // Extract pricing information
        const pricingSelectors = [
          '.price', '.pricing', '.cost', '.subscription',
          '[class*="price"]', '[class*="pricing"]'
        ];
        
        pricingSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 5) {
              pricing.push(text);
            }
          });
        });
        
        // Extract integration information
        const integrationSelectors = [
          '.integration', '.api', '.connector', '.plugin',
          '[class*="integration"]', '[class*="api"]'
        ];
        
        integrationSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 5) {
              integrations.push(text);
            }
          });
        });
        
        // Extract page title and meta description
        const title = document.title || '';
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        
        return {
          title,
          metaDescription,
          features: features.slice(0, 20), // Limit to first 20 features
          pricing: pricing.slice(0, 10),
          integrations: integrations.slice(0, 15),
          url: window.location.href
        };
      });
      
      await page.close();
      
      return {
        productInfo,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.log(`Error extracting product features from ${vendorUrl}: ${error.message}`, 'error');
      throw error;
    }
  }

  async extractFullWebsite(vendorUrl) {
    try {
      this.log(`Performing full website extraction for: ${vendorUrl}`);
      
      const results = {
        tos: await this.extractTermsOfService(vendorUrl),
        privacy: await this.extractPrivacyPolicy(vendorUrl),
        features: await this.extractProductFeatures(vendorUrl),
        metadata: {
          extractionType: 'full',
          vendorUrl,
          extractedAt: new Date().toISOString()
        }
      };
      
      // Perform compliance analysis
      results.complianceAnalysis = this.performComplianceAnalysis(results);
      
      return results;
      
    } catch (error) {
      this.log(`Error during full website extraction: ${error.message}`, 'error');
      throw error;
    }
  }

  analyzeTosContent(content) {
    const analysis = {
      dataCollection: this.analyzeDataCollection(content),
      dataUsage: this.analyzeDataUsage(content),
      dataSharing: this.analyzeDataSharing(content),
      userRights: this.analyzeUserRights(content),
      aiSpecific: this.analyzeAISpecificTerms(content),
      riskFactors: this.identifyRiskFactors(content),
      complianceScore: 0
    };
    
    // Calculate compliance score
    analysis.complianceScore = this.calculateComplianceScore(analysis);
    
    return analysis;
  }

  analyzePrivacyContent(content) {
    const analysis = {
      dataTypes: this.extractDataTypes(content),
      dataRetention: this.extractDataRetention(content),
      dataSecurity: this.analyzeDataSecurity(content),
      thirdPartySharing: this.analyzeThirdPartySharing(content),
      userConsent: this.analyzeUserConsent(content),
      internationalTransfers: this.analyzeInternationalTransfers(content),
      complianceScore: 0
    };
    
    analysis.complianceScore = this.calculatePrivacyComplianceScore(analysis);
    
    return analysis;
  }

  analyzeDataCollection(content) {
    const indicators = {
      personalData: ['personal data', 'personal information', 'pii', 'personally identifiable'],
      usageData: ['usage data', 'analytics', 'telemetry', 'logs'],
      biometricData: ['biometric', 'fingerprint', 'face recognition', 'voice'],
      locationData: ['location', 'gps', 'geolocation', 'ip address']
    };
    
    const results = {};
    
    for (const [type, keywords] of Object.entries(indicators)) {
      results[type] = keywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
    }
    
    return results;
  }

  analyzeDataUsage(content) {
    const usagePatterns = {
      marketing: ['marketing', 'advertising', 'promotional'],
      analytics: ['analytics', 'research', 'improvement'],
      personalization: ['personalization', 'customization', 'tailored'],
      aiTraining: ['ai training', 'machine learning', 'model improvement']
    };
    
    const results = {};
    
    for (const [purpose, keywords] of Object.entries(usagePatterns)) {
      results[purpose] = keywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
    }
    
    return results;
  }

  analyzeAISpecificTerms(content) {
    const aiTerms = {
      aiTraining: ['ai training', 'machine learning', 'model training'],
      dataRetention: ['data retention', 'data storage', 'data processing'],
      userConsent: ['consent', 'permission', 'authorization'],
      optOut: ['opt out', 'opt-out', 'withdraw consent'],
      transparency: ['transparency', 'explainability', 'interpretability']
    };
    
    const results = {};
    
    for (const [aspect, keywords] of Object.entries(aiTerms)) {
      results[aspect] = keywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
    }
    
    return results;
  }

  identifyRiskFactors(content) {
    const riskKeywords = {
      high: ['unlimited', 'irrevocable', 'perpetual', 'waiver', 'indemnify'],
      medium: ['reasonable', 'standard', 'typical', 'common'],
      low: ['limited', 'reasonable', 'proportional', 'appropriate']
    };
    
    const risks = [];
    
    for (const [level, keywords] of Object.entries(riskKeywords)) {
      const found = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      );
      if (found.length > 0) {
        risks.push({ level, keywords: found });
      }
    }
    
    return risks;
  }

  calculateComplianceScore(analysis) {
    let score = 100;
    
    // Deduct points for missing or concerning elements
    if (!analysis.userRights.optOut) score -= 20;
    if (!analysis.userRights.access) score -= 15;
    if (!analysis.userRights.deletion) score -= 15;
    if (analysis.riskFactors.some(r => r.level === 'high')) score -= 25;
    if (!analysis.aiSpecific.transparency) score -= 10;
    
    return Math.max(0, score);
  }

  calculatePrivacyComplianceScore(analysis) {
    let score = 100;
    
    if (!analysis.userConsent.explicit) score -= 20;
    if (!analysis.dataRetention.limits) score -= 15;
    if (!analysis.dataSecurity.encryption) score -= 15;
    if (analysis.thirdPartySharing.unlimited) score -= 20;
    if (!analysis.internationalTransfers.safeguards) score -= 10;
    
    return Math.max(0, score);
  }

  performComplianceAnalysis(results) {
    const analysis = {
      overallScore: 0,
      riskLevel: 'low',
      complianceIssues: [],
      recommendations: []
    };
    
    // Calculate overall score
    const scores = [];
    if (results.tos.complianceScore) scores.push(results.tos.complianceScore);
    if (results.privacy.complianceScore) scores.push(results.privacy.complianceScore);
    
    if (scores.length > 0) {
      analysis.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    
    // Determine risk level
    if (analysis.overallScore < 50) {
      analysis.riskLevel = 'high';
    } else if (analysis.overallScore < 75) {
      analysis.riskLevel = 'medium';
    }
    
    // Generate recommendations
    if (analysis.overallScore < 75) {
      analysis.recommendations.push('Review Terms of Service for compliance gaps');
      analysis.recommendations.push('Ensure Privacy Policy meets regulatory requirements');
      analysis.recommendations.push('Consider legal review of data handling practices');
    }
    
    return analysis;
  }

  async processQueue() {
    if (this.extractionQueue.length === 0 || this.activeExtractions >= this.maxConcurrentExtractions) {
      return;
    }
    
    const nextExtraction = this.extractionQueue.shift();
    if (nextExtraction) {
      this.log(`Processing queued extraction: ${nextExtraction.vendorUrl}`);
      this.extractVendorData(nextExtraction.vendorUrl, nextExtraction.extractionType);
    }
  }

  generateExtractionId(url) {
    return `ext-${Buffer.from(url).toString('base64').substring(0, 8)}`;
  }

  async getExtractionResult(extractionId) {
    return this.extractionResults.get(extractionId) || null;
  }

  async getExtractionHistory(limit = 50) {
    const results = Array.from(this.extractionResults.values());
    return results
      .sort((a, b) => new Date(b.extractedAt) - new Date(a.extractedAt))
      .slice(0, limit);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.log('Data Extraction Agent cleaned up');
  }

  getStatus() {
    return {
      activeExtractions: this.activeExtractions,
      queueLength: this.extractionQueue.length,
      totalResults: this.extractionResults.size,
      maxConcurrent: this.maxConcurrentExtractions
    };
  }
}

module.exports = DataExtractionAgent;
