const axios = require('axios');
const cheerio = require('cheerio');
const { AgentBase } = require('./agent-base.cjs');

class ToolDiscoveryAgent extends AgentBase {
  constructor() {
    super('ToolDiscoveryAgent', 'Discovers new AI tools from external sources');
    this.discoverySources = {
      github: {
        awesomeLists: [
          'https://github.com/josephmisiti/awesome-machine-learning',
          'https://github.com/owainlewis/awesome-artificial-intelligence',
          'https://github.com/neomatrix369/awesome-ai-ml-dl'
        ],
        rateLimit: 5000 // 5 seconds between requests
      },
      productHunt: {
        apiUrl: 'https://api.producthunt.com/v2/api/graphql',
        rateLimit: 1000 // 1 second between requests
      },
      newsSites: [
        'https://techcrunch.com/tag/artificial-intelligence/',
        'https://venturebeat.com/category/ai/',
        'https://www.theverge.com/ai-artificial-intelligence'
      ],
      regulatoryFeeds: {
        fda: 'https://www.fda.gov/news-events/fda-newsroom/press-announcements',
        ema: 'https://www.ema.europa.eu/en/news'
      }
    };
    this.discoveredTools = new Map();
    this.lastDiscoveryRun = null;
  }

  async discoverTools(source = 'all') {
    try {
      this.log('Starting tool discovery process...');
      const startTime = Date.now();
      
      let discoveredTools = [];
      
      if (source === 'all' || source === 'github') {
        const githubTools = await this.discoverFromGitHub();
        discoveredTools = discoveredTools.concat(githubTools);
      }
      
      if (source === 'all' || source === 'producthunt') {
        const phTools = await this.discoverFromProductHunt();
        discoveredTools = discoveredTools.concat(phTools);
      }
      
      if (source === 'all' || source === 'news') {
        const newsTools = await this.discoverFromNewsSites();
        discoveredTools = discoveredTools.concat(newsTools);
      }
      
      if (source === 'all' || source === 'regulatory') {
        const regulatoryUpdates = await this.discoverRegulatoryUpdates();
        discoveredTools = discoveredTools.concat(regulatoryUpdates);
      }
      
      // Filter out duplicates and validate tools
      const uniqueTools = this.deduplicateTools(discoveredTools);
      const validTools = await this.validateTools(uniqueTools);
      
      // Store discovered tools
      for (const tool of validTools) {
        this.discoveredTools.set(tool.id, tool);
      }
      
      this.lastDiscoveryRun = new Date();
      const processingTime = Date.now() - startTime;
      
      this.log(`Discovery complete. Found ${validTools.length} new tools in ${processingTime}ms`);
      
      return {
        success: true,
        toolsDiscovered: validTools.length,
        processingTime,
        tools: validTools
      };
      
    } catch (error) {
      this.log(`Error during tool discovery: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async discoverFromGitHub() {
    const tools = [];
    
    for (const awesomeList of this.discoverySources.github.awesomeLists) {
      try {
        this.log(`Discovering tools from GitHub: ${awesomeList}`);
        
        const response = await axios.get(awesomeList, {
          headers: {
            'User-Agent': 'AICOMPLYR-ToolDiscovery/1.0'
          }
        });
        
        const $ = cheerio.load(response.data);
        const links = $('a[href*="github.com"]');
        
        links.each((i, link) => {
          const href = $(link).attr('href');
          const text = $(link).text().trim();
          
          if (this.isAITool(text, href)) {
            tools.push({
              id: this.generateToolId(href),
              name: text,
              source: 'github',
              url: href,
              description: this.extractDescription($, link),
              category: this.categorizeTool(text),
              discoveredAt: new Date().toISOString(),
              metadata: {
                awesomeList,
                stars: this.extractStars($, link),
                lastUpdated: this.extractLastUpdated($, link)
              }
            });
          }
        });
        
        // Rate limiting
        await this.delay(this.discoverySources.github.rateLimit);
        
      } catch (error) {
        this.log(`Error discovering from GitHub ${awesomeList}: ${error.message}`, 'error');
      }
    }
    
    return tools;
  }

  async discoverFromProductHunt() {
    // Note: Product Hunt requires API key for production use
    // This is a simplified version for demonstration
    const tools = [];
    
    try {
      this.log('Discovering tools from Product Hunt...');
      
      // Mock data for demonstration - replace with actual API calls
      const mockTools = [
        {
          id: 'ph-ai-tool-1',
          name: 'AI Writing Assistant',
          source: 'producthunt',
          url: 'https://producthunt.com/posts/ai-writing-assistant',
          description: 'AI-powered writing tool for content creation',
          category: 'content-creation',
          discoveredAt: new Date().toISOString(),
          metadata: {
            votes: 150,
            launchDate: '2024-01-15'
          }
        }
      ];
      
      tools.push(...mockTools);
      
    } catch (error) {
      this.log(`Error discovering from Product Hunt: ${error.message}`, 'error');
    }
    
    return tools;
  }

  async discoverFromNewsSites() {
    const tools = [];
    
    for (const newsSite of this.discoverySources.newsSites) {
      try {
        this.log(`Discovering tools from news site: ${newsSite}`);
        
        const response = await axios.get(newsSite, {
          headers: {
            'User-Agent': 'AICOMPLYR-ToolDiscovery/1.0'
          }
        });
        
        const $ = cheerio.load(response.data);
        const articles = $('article, .post, .entry');
        
        articles.each((i, article) => {
          const title = $(article).find('h1, h2, h3').first().text().trim();
          const link = $(article).find('a').first().attr('href');
          const content = $(article).text().trim();
          
          if (this.isAITool(title, content)) {
            tools.push({
              id: this.generateToolId(link || title),
              name: title,
              source: 'news',
              url: link,
              description: this.extractDescription($, article),
              category: this.categorizeTool(title),
              discoveredAt: new Date().toISOString(),
              metadata: {
                newsSite,
                publishDate: this.extractPublishDate($, article),
                author: this.extractAuthor($, article)
              }
            });
          }
        });
        
        // Rate limiting
        await this.delay(2000);
        
      } catch (error) {
        this.log(`Error discovering from news site ${newsSite}: ${error.message}`, 'error');
      }
    }
    
    return tools;
  }

  async discoverRegulatoryUpdates() {
    const updates = [];
    
    try {
      this.log('Discovering regulatory updates...');
      
      // FDA updates
      if (this.discoverySources.regulatoryFeeds.fda) {
        const fdaUpdates = await this.scrapeRegulatorySite(
          this.discoverySources.regulatoryFeeds.fda,
          'fda'
        );
        updates.push(...fdaUpdates);
      }
      
      // EMA updates
      if (this.discoverySources.regulatoryFeeds.ema) {
        const emaUpdates = await this.scrapeRegulatorySite(
          this.discoverySources.regulatoryFeeds.ema,
          'ema'
        );
        updates.push(...emaUpdates);
      }
      
    } catch (error) {
      this.log(`Error discovering regulatory updates: ${error.message}`, 'error');
    }
    
    return updates;
  }

  async scrapeRegulatorySite(url, source) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'AICOMPLYR-ToolDiscovery/1.0'
        }
      });
      
      const $ = cheerio.load(response.data);
      const updates = [];
      
      // Generic scraping - adjust selectors based on actual site structure
      const items = $('article, .news-item, .press-release');
      
      items.each((i, item) => {
        const title = $(item).find('h1, h2, h3, .title').first().text().trim();
        const link = $(item).find('a').first().attr('href');
        const date = $(item).find('.date, time').first().text().trim();
        
        if (this.isAIRelevant(title)) {
          updates.push({
            id: this.generateToolId(`${source}-${title}`),
            name: title,
            source: 'regulatory',
            url: link ? new URL(link, url).href : url,
            description: $(item).text().trim().substring(0, 200),
            category: 'regulatory-update',
            discoveredAt: new Date().toISOString(),
            metadata: {
              regulatoryBody: source.toUpperCase(),
              publishDate: date,
              impact: this.assessRegulatoryImpact(title)
            }
          });
        }
      });
      
      return updates;
      
    } catch (error) {
      this.log(`Error scraping regulatory site ${url}: ${error.message}`, 'error');
      return [];
    }
  }

  isAITool(title, content = '') {
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'nlp', 'computer vision', 'automation', 'chatbot',
      'gpt', 'claude', 'llm', 'large language model', 'generative ai'
    ];
    
    const combinedText = `${title} ${content}`.toLowerCase();
    return aiKeywords.some(keyword => combinedText.includes(keyword));
  }

  isAIRelevant(title) {
    const relevantKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'algorithm',
      'automation', 'digital health', 'healthcare ai', 'medical ai',
      'drug discovery', 'clinical trial', 'regulatory', 'compliance'
    ];
    
    const titleLower = title.toLowerCase();
    return relevantKeywords.some(keyword => titleLower.includes(keyword));
  }

  categorizeTool(name) {
    const categories = {
      'content-creation': ['writing', 'content', 'copy', 'blog', 'article'],
      'image-generation': ['image', 'photo', 'art', 'design', 'visual'],
      'code-generation': ['code', 'programming', 'developer', 'software'],
      'data-analysis': ['data', 'analytics', 'insights', 'reporting'],
      'automation': ['automate', 'workflow', 'process', 'task'],
      'chatbot': ['chat', 'bot', 'conversation', 'support'],
      'research': ['research', 'study', 'analysis', 'discovery']
    };
    
    const nameLower = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  assessRegulatoryImpact(title) {
    const highImpactKeywords = ['ban', 'restrict', 'prohibit', 'emergency', 'recall'];
    const mediumImpactKeywords = ['guidance', 'policy', 'regulation', 'compliance'];
    
    const titleLower = title.toLowerCase();
    
    if (highImpactKeywords.some(keyword => titleLower.includes(keyword))) {
      return 'high';
    } else if (mediumImpactKeywords.some(keyword => titleLower.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  generateToolId(input) {
    return `tool-${Buffer.from(input).toString('base64').substring(0, 8)}`;
  }

  extractDescription($, element) {
    const description = $(element).find('.description, .summary, p').first().text().trim();
    return description.substring(0, 150) + (description.length > 150 ? '...' : '');
  }

  extractStars($, element) {
    // Extract GitHub stars if available
    const starElement = $(element).find('.stars, .stargazers');
    return starElement.length ? starElement.text().trim() : null;
  }

  extractLastUpdated($, element) {
    // Extract last updated date if available
    const dateElement = $(element).find('.updated, .date, time');
    return dateElement.length ? dateElement.attr('datetime') || dateElement.text().trim() : null;
  }

  extractPublishDate($, element) {
    const dateElement = $(element).find('.date, time, .publish-date');
    return dateElement.length ? dateElement.attr('datetime') || dateElement.text().trim() : null;
  }

  extractAuthor($, element) {
    const authorElement = $(element).find('.author, .byline');
    return authorElement.length ? authorElement.text().trim() : null;
  }

  deduplicateTools(tools) {
    const seen = new Set();
    return tools.filter(tool => {
      const key = `${tool.name}-${tool.source}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async validateTools(tools) {
    // Basic validation - check if tools have required fields
    return tools.filter(tool => 
      tool.name && 
      tool.source && 
      tool.category &&
      tool.name.length > 2
    );
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDiscoveryStats() {
    return {
      totalToolsDiscovered: this.discoveredTools.size,
      lastDiscoveryRun: this.lastDiscoveryRun,
      sources: Object.keys(this.discoverySources),
      toolsBySource: this.getToolsBySource()
    };
  }

  getToolsBySource() {
    const bySource = {};
    for (const tool of this.discoveredTools.values()) {
      if (!bySource[tool.source]) {
        bySource[tool.source] = [];
      }
      bySource[tool.source].push(tool);
    }
    return bySource;
  }

  async getToolById(id) {
    return this.discoveredTools.get(id) || null;
  }

  async searchTools(query, filters = {}) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const tool of this.discoveredTools.values()) {
      if (tool.name.toLowerCase().includes(queryLower) ||
          tool.description.toLowerCase().includes(queryLower)) {
        
        // Apply filters
        if (filters.source && tool.source !== filters.source) continue;
        if (filters.category && tool.category !== filters.category) continue;
        if (filters.dateFrom && new Date(tool.discoveredAt) < new Date(filters.dateFrom)) continue;
        
        results.push(tool);
      }
    }
    
    return results.sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
  }
}

module.exports = ToolDiscoveryAgent;
