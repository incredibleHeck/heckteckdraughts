/**
 * AI Transposition Table - Caching for position evaluation
 * Extracted from the working self-contained AI
 * Enhanced with better replacement strategy and statistics
 * @author codewithheck
 * Modular Architecture Phase 1
 */

import { CACHE_CONFIG } from './ai.constants.js';
import { generatePositionKey } from './ai.utils.js';

/**
 * Transposition Table for caching search results
 * PRESERVES EXACT LOGIC from working version with enhancements
 */
export class TranspositionTable {
    constructor(maxSize = CACHE_CONFIG.MAX_SIZE) {
        this.table = new Map();
        this.maxSize = maxSize;
        
        // Statistics tracking
        this.hits = 0;
        this.misses = 0;
        this.stores = 0;
        this.collisions = 0;
        this.replacements = 0;
        
        // Performance monitoring
        this.creationTime = Date.now();
        this.lastCleanupTime = Date.now();
    }

    /**
     * Generate cache key for position
     * PRESERVES EXACT LOGIC from working version
     */
    generateKey(position) {
        return generatePositionKey(position);
    }

    /**
     * Store position evaluation in cache
     * Enhanced with better replacement strategy
     */
    store(key, depth, value, type, bestMove = null) {
        // Check if we need cleanup
        if (this.table.size >= this.maxSize) {
            this.cleanup();
        }
        
        const entry = {
            depth,
            value,
            type,
            bestMove,
            age: Date.now(),
            accessCount: 1
        };
        
        // Check for replacement
        if (this.table.has(key)) {
            const existing = this.table.get(key);
            
            // Only replace if new entry is deeper or newer
            if (CACHE_CONFIG.REPLACEMENT.DEPTH_PREFERRED) {
                if (depth < existing.depth) {
                    this.collisions++;
                    return; // Don't replace deeper search
                }
            }
            
            this.replacements++;
        }
        
        this.table.set(key, entry);
        this.stores++;
    }

    /**
     * Lookup position in cache
     * PRESERVES EXACT LOGIC from working version
     */
    lookup(key, depth, alpha, beta) {
        const entry = this.table.get(key);
        
        if (!entry || entry.depth < depth) {
            this.misses++;
            return null;
        }
        
        // Update access statistics
        entry.accessCount++;
        entry.age = Date.now();
        
        this.hits++;
        
        // Return based on bound type (EXACT LOGIC from working version)
        if (entry.type === CACHE_CONFIG.ENTRY_TYPES.EXACT) {
            return entry;
        } else if (entry.type === CACHE_CONFIG.ENTRY_TYPES.LOWER_BOUND && entry.value >= beta) {
            return entry;
        } else if (entry.type === CACHE_CONFIG.ENTRY_TYPES.UPPER_BOUND && entry.value <= alpha) {
            return entry;
        }
        
        return null;
    }

    /**
     * Get best move from cache if available
     */
    getBestMove(key) {
        const entry = this.table.get(key);
        if (entry && entry.bestMove) {
            entry.accessCount++;
            return entry.bestMove;
        }
        return null;
    }

    /**
     * Cleanup cache when full
     * Enhanced replacement strategy
     */
    cleanup() {
        const startTime = Date.now();
        const entries = Array.from(this.table.entries());
        const toDelete = Math.floor(entries.length * CACHE_CONFIG.CLEANUP_PERCENT);
        
        // Sort by replacement priority
        entries.sort((a, b) => {
            const entryA = a[1];
            const entryB = b[1];
            
            // Priority: age + depth + access count
            const scoreA = this.calculateReplacementScore(entryA);
            const scoreB = this.calculateReplacementScore(entryB);
            
            return scoreA - scoreB; // Lower score = higher replacement priority
        });
        
        // Remove lowest priority entries
        for (let i = 0; i < toDelete; i++) {
            this.table.delete(entries[i][0]);
        }
        
        this.lastCleanupTime = Date.now();
        
        console.log(`Cache cleanup: removed ${toDelete} entries in ${Date.now() - startTime}ms`);
    }

    /**
     * Calculate replacement score for cache entry
     * Lower score = higher replacement priority
     */
    calculateReplacementScore(entry) {
        const now = Date.now();
        const age = now - entry.age;
        const ageScore = age * CACHE_CONFIG.REPLACEMENT.AGE_FACTOR;
        const depthScore = entry.depth * 100; // Prefer keeping deeper searches
        const accessScore = entry.accessCount * 10; // Prefer keeping frequently accessed
        
        return ageScore - depthScore - accessScore;
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.table.clear();
        this.hits = 0;
        this.misses = 0;
        this.stores = 0;
        this.collisions = 0;
        this.replacements = 0;
        this.lastCleanupTime = Date.now();
    }

    /**
     * Get comprehensive statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
        const uptime = Date.now() - this.creationTime;
        const timeSinceCleanup = Date.now() - this.lastCleanupTime;
        
        return {
            // Basic stats
            size: this.table.size,
            maxSize: this.maxSize,
            utilization: ((this.table.size / this.maxSize) * 100).toFixed(1) + '%',
            
            // Access stats
            hits: this.hits,
            misses: this.misses,
            stores: this.stores,
            hitRate: hitRate + '%',
            
            // Collision stats
            collisions: this.collisions,
            replacements: this.replacements,
            
            // Timing stats
            uptime: Math.floor(uptime / 1000) + 's',
            timeSinceCleanup: Math.floor(timeSinceCleanup / 1000) + 's',
            
            // Performance metrics
            hitsPerSecond: Math.floor(this.hits / (uptime / 1000)),
            storesPerSecond: Math.floor(this.stores / (uptime / 1000))
        };
    }

    /**
     * Get detailed cache analysis
     */
    getDetailedStats() {
        const stats = this.getStats();
        const entries = Array.from(this.table.values());
        
        if (entries.length === 0) {
            return { ...stats, analysis: 'Cache is empty' };
        }
        
        // Analyze cache contents
        const depths = entries.map(e => e.depth);
        const ages = entries.map(e => Date.now() - e.age);
        const accessCounts = entries.map(e => e.accessCount);
        
        const analysis = {
            averageDepth: (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1),
            maxDepth: Math.max(...depths),
            minDepth: Math.min(...depths),
            
            averageAge: Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length / 1000) + 's',
            maxAge: Math.floor(Math.max(...ages) / 1000) + 's',
            minAge: Math.floor(Math.min(...ages) / 1000) + 's',
            
            averageAccessCount: (accessCounts.reduce((a, b) => a + b, 0) / accessCounts.length).toFixed(1),
            maxAccessCount: Math.max(...accessCounts),
            
            // Entry type distribution
            exactEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.EXACT).length,
            lowerBoundEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.LOWER_BOUND).length,
            upperBoundEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.UPPER_BOUND).length,
            
            // Best move coverage
            entriesWithBestMove: entries.filter(e => e.bestMove !== null).length
        };
        
        return { ...stats, analysis };
    }

    /**
     * Resize cache (useful for dynamic memory management)
     */
    resize(newSize) {
        if (newSize < 1000) {
            throw new Error('Cache size must be at least 1000 entries');
        }
        
        this.maxSize = newSize;
        
        // If current size exceeds new limit, cleanup immediately
        if (this.table.size > newSize) {
            const toDelete = this.table.size - newSize;
            const entries = Array.from(this.table.entries());
            
            // Sort and remove lowest priority entries
            entries.sort((a, b) => {
                const scoreA = this.calculateReplacementScore(a[1]);
                const scoreB = this.calculateReplacementScore(b[1]);
                return scoreA - scoreB;
            });
            
            for (let i = 0; i < toDelete; i++) {
                this.table.delete(entries[i][0]);
            }
        }
    }

    /**
     * Probe cache for debugging
     */
    probe(key) {
        const entry = this.table.get(key);
        return entry ? { ...entry } : null;
    }

    /**
     * Get cache efficiency metrics
     */
    getEfficiency() {
        const stats = this.getStats();
        const total = this.hits + this.misses;
        
        if (total === 0) {
            return {
                efficiency: 0,
                recommendation: 'No searches performed yet'
            };
        }
        
        const hitRate = this.hits / total;
        let efficiency, recommendation;
        
        if (hitRate > 0.7) {
            efficiency = 'Excellent';
            recommendation = 'Cache is performing very well';
        } else if (hitRate > 0.5) {
            efficiency = 'Good';
            recommendation = 'Cache performance is acceptable';
        } else if (hitRate > 0.3) {
            efficiency = 'Fair';
            recommendation = 'Consider increasing cache size or adjusting search parameters';
        } else {
            efficiency = 'Poor';
            recommendation = 'Cache may be too small or replacement strategy needs tuning';
        }
        
        return {
            efficiency,
            hitRate: (hitRate * 100).toFixed(1) + '%',
            recommendation,
            totalLookups: total,
            utilization: stats.utilization
        };
    }

    /**
     * Export cache state for analysis
     */
    exportState() {
        const entries = Array.from(this.table.entries()).map(([key, entry]) => ({
            key: key.substring(0, 20) + '...', // Truncate for readability
            depth: entry.depth,
            type: entry.type,
            age: Math.floor((Date.now() - entry.age) / 1000),
            accessCount: entry.accessCount,
            hasBestMove: entry.bestMove !== null
        }));
        
        return {
            timestamp: new Date().toISOString(),
            stats: this.getStats(),
            entries: entries.slice(0, 100) // Limit to first 100 for readability
        };
    }

    /**
     * Memory usage estimation
     */
    getMemoryUsage() {
        const entrySize = 100; // Rough estimate per entry in bytes
        const totalMemory = this.table.size * entrySize;
        
        return {
            entries: this.table.size,
            estimatedBytes: totalMemory,
            estimatedKB: Math.floor(totalMemory / 1024),
            estimatedMB: (totalMemory / (1024 * 1024)).toFixed(2)
        };
    }
}