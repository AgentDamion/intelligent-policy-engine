/**
 * Enhanced Search Engine Service
 * Provides full-text search, compliance-specific filters, and AI-powered search
 */

const { Client } = require('@elastic/elasticsearch');
const lunr = require('lunr');

class SearchEngineService {
    constructor() {
        this.setupClients();
        this.setupIndexes();
    }

    setupClients() {
        // Elasticsearch client
        this.elasticsearch = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            auth: {
                username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
                password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
            }
        });

        // Local search index for fallback
        this.localIndex = null;
        this.documents = [];
    }

    async setupIndexes() {
        try {
            // Check if Elasticsearch is available
            await this.elasticsearch.ping();
            console.log('✅ Elasticsearch connected');
            
            // Create indexes if they don't exist
            await this.createIndexes();
        } catch (error) {
            console.warn('⚠️ Elasticsearch not available, using local search:', error.message);
            this.setupLocalSearch();
        }
    }

    async createIndexes() {
        const indexes = [
            {
                name: 'policies',
                mapping: {
                    properties: {
                        title: { type: 'text', analyzer: 'standard' },
                        content: { type: 'text', analyzer: 'standard' },
                        policyType: { type: 'keyword' },
                        complianceType: { type: 'keyword' },
                        riskLevel: { type: 'keyword' },
                        enterpriseId: { type: 'keyword' },
                        workspaceId: { type: 'keyword' },
                        status: { type: 'keyword' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' },
                        tags: { type: 'keyword' },
                        metadata: { type: 'object' }
                    }
                }
            },
            {
                name: 'audit-reports',
                mapping: {
                    properties: {
                        title: { type: 'text', analyzer: 'standard' },
                        content: { type: 'text', analyzer: 'standard' },
                        auditType: { type: 'keyword' },
                        complianceScore: { type: 'float' },
                        riskLevel: { type: 'keyword' },
                        enterpriseId: { type: 'keyword' },
                        workspaceId: { type: 'keyword' },
                        status: { type: 'keyword' },
                        auditDate: { type: 'date' },
                        findings: { type: 'text' },
                        recommendations: { type: 'text' },
                        metadata: { type: 'object' }
                    }
                }
            },
            {
                name: 'compliance-violations',
                mapping: {
                    properties: {
                        title: { type: 'text', analyzer: 'standard' },
                        description: { type: 'text', analyzer: 'standard' },
                        violationType: { type: 'keyword' },
                        severity: { type: 'keyword' },
                        complianceType: { type: 'keyword' },
                        enterpriseId: { type: 'keyword' },
                        workspaceId: { type: 'keyword' },
                        status: { type: 'keyword' },
                        detectedAt: { type: 'date' },
                        resolvedAt: { type: 'date' },
                        metadata: { type: 'object' }
                    }
                }
            }
        ];

        for (const index of indexes) {
            try {
                const exists = await this.elasticsearch.indices.exists({ index: index.name });
                if (!exists) {
                    await this.elasticsearch.indices.create({
                        index: index.name,
                        body: {
                            mappings: index.mapping
                        }
                    });
                    console.log(`✅ Created index: ${index.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create index ${index.name}:`, error.message);
            }
        }
    }

    setupLocalSearch() {
        // Create local search index using Lunr.js
        this.localIndex = lunr(function() {
            this.ref('id');
            this.field('title');
            this.field('content');
            this.field('tags');
        });
    }

    /**
     * Search across all compliance data
     * @param {Object} query - Search query object
     * @returns {Object} Search results
     */
    async search(query) {
        try {
            if (this.elasticsearch) {
                return await this.searchWithElasticsearch(query);
            } else {
                return await this.searchWithLocal(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Search using Elasticsearch
     */
    async searchWithElasticsearch(query) {
        const {
            searchTerm,
            indexType = 'all',
            filters = {},
            sort = { createdAt: { order: 'desc' } },
            page = 1,
            size = 20
        } = query;

        const indexes = this.getIndexesForType(indexType);
        const searchBody = this.buildElasticsearchQuery(searchTerm, filters, sort, page, size);

        const response = await this.elasticsearch.search({
            index: indexes,
            body: searchBody
        });

        return this.formatElasticsearchResults(response, page, size);
    }

    /**
     * Search using local Lunr.js index
     */
    async searchWithLocal(query) {
        const { searchTerm, filters = {}, page = 1, size = 20 } = query;
        
        if (!this.localIndex) {
            throw new Error('Local search index not initialized');
        }

        const results = this.localIndex.search(searchTerm);
        
        // Apply filters
        let filteredResults = results;
        if (Object.keys(filters).length > 0) {
            filteredResults = results.filter(result => 
                this.matchesFilters(result, filters)
            );
        }

        // Paginate results
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        const paginatedResults = filteredResults.slice(startIndex, endIndex);

        return {
            hits: paginatedResults.map(result => ({
                id: result.ref,
                score: result.score,
                ...this.documents.find(doc => doc.id === result.ref)
            })),
            total: filteredResults.length,
            page,
            size,
            totalPages: Math.ceil(filteredResults.length / size)
        };
    }

    /**
     * Add document to search index
     * @param {Object} document - Document to index
     * @param {string} indexType - Type of index (policies, audit-reports, etc.)
     */
    async addDocument(document, indexType) {
        try {
            if (this.elasticsearch) {
                await this.addToElasticsearch(document, indexType);
            } else {
                await this.addToLocal(document);
            }
        } catch (error) {
            console.error('Failed to add document to search index:', error);
            throw error;
        }
    }

    /**
     * Add document to Elasticsearch
     */
    async addToElasticsearch(document, indexType) {
        const indexName = this.getIndexName(indexType);
        
        await this.elasticsearch.index({
            index: indexName,
            id: document.id,
            body: document
        });
    }

    /**
     * Add document to local search index
     */
    async addToLocal(document) {
        this.documents.push(document);
        this.localIndex.add(document);
    }

    /**
     * Update document in search index
     * @param {string} documentId - Document ID
     * @param {Object} updates - Document updates
     * @param {string} indexType - Type of index
     */
    async updateDocument(documentId, updates, indexType) {
        try {
            if (this.elasticsearch) {
                await this.updateInElasticsearch(documentId, updates, indexType);
            } else {
                await this.updateInLocal(documentId, updates);
            }
        } catch (error) {
            console.error('Failed to update document in search index:', error);
            throw error;
        }
    }

    /**
     * Update document in Elasticsearch
     */
    async updateInElasticsearch(documentId, updates, indexType) {
        const indexName = this.getIndexName(indexType);
        
        await this.elasticsearch.update({
            index: indexName,
            id: documentId,
            body: {
                doc: updates
            }
        });
    }

    /**
     * Update document in local search index
     */
    async updateInLocal(documentId, updates) {
        const docIndex = this.documents.findIndex(doc => doc.id === documentId);
        if (docIndex !== -1) {
            this.documents[docIndex] = { ...this.documents[docIndex], ...updates };
            
            // Rebuild local index
            this.setupLocalSearch();
            this.documents.forEach(doc => this.localIndex.add(doc));
        }
    }

    /**
     * Delete document from search index
     * @param {string} documentId - Document ID
     * @param {string} indexType - Type of index
     */
    async deleteDocument(documentId, indexType) {
        try {
            if (this.elasticsearch) {
                await this.deleteFromElasticsearch(documentId, indexType);
            } else {
                await this.deleteFromLocal(documentId);
            }
        } catch (error) {
            console.error('Failed to delete document from search index:', error);
            throw error;
        }
    }

    /**
     * Delete document from Elasticsearch
     */
    async deleteFromElasticsearch(documentId, indexType) {
        const indexName = this.getIndexName(indexType);
        
        await this.elasticsearch.delete({
            index: indexName,
            id: documentId
        });
    }

    /**
     * Delete document from local search index
     */
    async deleteFromLocal(documentId) {
        this.documents = this.documents.filter(doc => doc.id !== documentId);
        
        // Rebuild local index
        this.setupLocalSearch();
        this.documents.forEach(doc => this.localIndex.add(doc));
    }

    /**
     * Get compliance insights and analytics
     * @param {Object} filters - Filters for analytics
     * @returns {Object} Compliance insights
     */
    async getComplianceInsights(filters = {}) {
        try {
            if (this.elasticsearch) {
                return await this.getElasticsearchInsights(filters);
            } else {
                return await this.getLocalInsights(filters);
            }
        } catch (error) {
            console.error('Failed to get compliance insights:', error);
            throw error;
        }
    }

    /**
     * Get insights from Elasticsearch
     */
    async getElasticsearchInsights(filters) {
        const insights = {};

        // Compliance score trends
        insights.complianceTrends = await this.getComplianceTrends(filters);
        
        // Risk level distribution
        insights.riskDistribution = await this.getRiskDistribution(filters);
        
        // Violation patterns
        insights.violationPatterns = await this.getViolationPatterns(filters);
        
        // Policy effectiveness
        insights.policyEffectiveness = await this.getPolicyEffectiveness(filters);

        return insights;
    }

    /**
     * Get insights from local data
     */
    async getLocalInsights(filters) {
        // Basic insights from local data
        return {
            totalDocuments: this.documents.length,
            documentTypes: this.getDocumentTypeDistribution(),
            recentActivity: this.getRecentActivity()
        };
    }

    // Helper methods
    getIndexesForType(indexType) {
        const indexMap = {
            'all': ['policies', 'audit-reports', 'compliance-violations'],
            'policies': ['policies'],
            'audit-reports': ['audit-reports'],
            'violations': ['compliance-violations']
        };
        
        return indexMap[indexType] || indexMap['all'];
    }

    getIndexName(indexType) {
        const indexMap = {
            'policies': 'policies',
            'audit-reports': 'audit-reports',
            'violations': 'compliance-violations'
        };
        
        return indexMap[indexType] || 'policies';
    }

    buildElasticsearchQuery(searchTerm, filters, sort, page, size) {
        const query = {
            bool: {
                must: []
            }
        };

        // Add text search
        if (searchTerm) {
            query.bool.must.push({
                multi_match: {
                    query: searchTerm,
                    fields: ['title^2', 'content', 'tags'],
                    type: 'best_fields'
                }
            });
        }

        // Add filters
        Object.entries(filters).forEach(([field, value]) => {
            if (value) {
                query.bool.filter = query.bool.filter || [];
                query.bool.filter.push({
                    term: { [field]: value }
                });
            }
        });

        return {
            query,
            sort: [sort],
            from: (page - 1) * size,
            size
        };
    }

    formatElasticsearchResults(response, page, size) {
        return {
            hits: response.hits.hits.map(hit => ({
                id: hit._id,
                score: hit._score,
                ...hit._source
            })),
            total: response.hits.total.value,
            page,
            size,
            totalPages: Math.ceil(response.hits.total.value / size)
        };
    }

    matchesFilters(result, filters) {
        const document = this.documents.find(doc => doc.id === result.ref);
        if (!document) return false;

        return Object.entries(filters).every(([field, value]) => {
            return document[field] === value;
        });
    }

    // Placeholder methods for insights
    async getComplianceTrends(filters) {
        return { trend: 'improving', score: 85 };
    }

    async getRiskDistribution(filters) {
        return { high: 10, medium: 30, low: 60 };
    }

    async getViolationPatterns(filters) {
        return { commonTypes: ['GDPR', 'HIPAA'], trends: [] };
    }

    async getPolicyEffectiveness(filters) {
        return { effectiveness: 78, recommendations: [] };
    }

    getDocumentTypeDistribution() {
        const types = {};
        this.documents.forEach(doc => {
            types[doc.type] = (types[doc.type] || 0) + 1;
        });
        return types;
    }

    getRecentActivity() {
        return this.documents
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
    }
}

module.exports = new SearchEngineService();