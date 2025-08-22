/**
 * AI Transposition Table - Caching for position evaluation
 * C++-style cluster logic adaptation for 10x10 draughts
 * Enhanced with statistics, replacement strategy, and compatibility with existing game logic
 * @author codewithheck (with GitHub Copilot adaptation)
 * Modular Architecture Phase 1+
 */

import { CACHE_CONFIG } from './ai.constants.js';
import { generatePositionKey } from './ai.utils.js';

// C++-style cluster size (number of entries per bucket)
const Cluster_Size = 4;

/**
 * Transposition Table for caching search results
 * Implements clustered hash buckets as in high-performance C++ engines,
 * but preserves API and logic from the working JavaScript version.
 */
export class TranspositionTable {
    constructor(maxSize = CACHE_CONFIG.MAX_SIZE) {
        // Table size as power of 2, for efficient masking
        this.size = 1 << Math.floor(Math.log2(maxSize));
        this.mask = (this.size - 1) & -Cluster_Size;
        // Array of clusters (each is an array of up to Cluster_Size entries)
        this.table = Array.from({ length: this.size }, () => []);
        
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
     * You can customize this (this is a placeholder for your real hash)
     */
    generateKey(position) {
        return generatePositionKey(position);
    }

    /**
     * Hash a string key deterministically to an integer index
     * Uses the same logic as C++ (bitmasking for power-of-2 table)
     */
    getIndex(key) {
        // Simple deterministic hash for string keys
        let hash = 0, str = key;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return (hash & this.mask);
    }

    /**
     * Store position evaluation in cluster (C++ logic)
     * Replacement prefers deeper and newer entries
     */
    store(key, depth, value, type, bestMove = null) {
        const index = this.getIndex(key);
        let cluster = this.table[index];

        // If cluster has space, add a new entry
        if (cluster.length < Cluster_Size) {
            cluster.push({
                key, depth, value, type, bestMove,
                date: Date.now(),
                accessCount: 1
            });
            this.stores++;
            return;
        }

        // Otherwise, find the best replacement candidate in cluster
        let bestIdx = -1, bestScore = -Infinity;
        for (let i = 0; i < Cluster_Size; i++) {
            let entry = cluster[i];
            // Prefer to replace shallowest and least-used, then oldest
            let score = -entry.depth * 100 - entry.accessCount + (Date.now() - entry.date) / 1000;
            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }
        // Only replace if new entry is deeper or same depth
        if (depth >= cluster[bestIdx].depth) {
            cluster[bestIdx] = {
                key, depth, value, type, bestMove,
                date: Date.now(),
                accessCount: 1
            };
            this.replacements++;
            this.stores++;
        } else {
            this.collisions++;
        }
    }

    /**
     * Lookup position in cache (C++ cluster logic)
     * Returns entry if found and valid for requested depth and bounds
     */
    lookup(key, depth, alpha, beta) {
        const index = this.getIndex(key);
        const cluster = this.table[index];
        for (let i = 0; i < cluster.length; i++) {
            const entry = cluster[i];
            if (entry.key === key && entry.depth >= depth) {
                entry.accessCount++;
                entry.date = Date.now();
                this.hits++;
                // Bound type logic (EXACT, LOWER, UPPER)
                if (entry.type === CACHE_CONFIG.ENTRY_TYPES.EXACT) return entry;
                if (entry.type === CACHE_CONFIG.ENTRY_TYPES.LOWER_BOUND && entry.value >= beta) return entry;
                if (entry.type === CACHE_CONFIG.ENTRY_TYPES.UPPER_BOUND && entry.value <= alpha) return entry;
            }
        }
        this.misses++;
        return null;
    }

    /**
     * Get best move from cache if available (C++ cluster logic)
     */
    getBestMove(key) {
        const index = this.getIndex(key);
        const cluster = this.table[index];
        for (let entry of cluster) {
            if (entry.key === key && entry.bestMove !== null) {
                entry.accessCount++;
                return entry.bestMove;
            }
        }
        return null;
    }

    /**
     * Remove all entries from the table
     */
    clear() {
        for (let i = 0; i < this.size; i++) this.table[i] = [];
        this.hits = this.misses = this.stores = this.collisions = this.replacements = 0;
        this.lastCleanupTime = Date.now();
    }

    /**
     * Comprehensive statistics about table usage
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
        const entries = this.table.reduce((sum, c) => sum + c.length, 0);
        const uptime = Date.now() - this.creationTime;
        const timeSinceCleanup = Date.now() - this.lastCleanupTime;
        return {
            size: entries,
            clusterCount: this.size,
            clusterSize: Cluster_Size,
            maxSize: this.size * Cluster_Size,
            utilization: ((entries / (this.size * Cluster_Size)) * 100).toFixed(1) + '%',
            hits: this.hits,
            misses: this.misses,
            stores: this.stores,
            hitRate: hitRate + '%',
            collisions: this.collisions,
            replacements: this.replacements,
            uptime: Math.floor(uptime / 1000) + 's',
            timeSinceCleanup: Math.floor(timeSinceCleanup / 1000) + 's',
            hitsPerSecond: Math.floor(this.hits / (uptime / 1000)),
            storesPerSecond: Math.floor(this.stores / (uptime / 1000))
        };
    }

    /**
     * Detailed cache analysis (average depth, age, access, etc.)
     */
    getDetailedStats() {
        const stats = this.getStats();
        const entries = this.table.flat();
        if (entries.length === 0) {
            return { ...stats, analysis: 'Cache is empty' };
        }
        const depths = entries.map(e => e.depth);
        const ages = entries.map(e => Date.now() - e.date);
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
            exactEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.EXACT).length,
            lowerBoundEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.LOWER_BOUND).length,
            upperBoundEntries: entries.filter(e => e.type === CACHE_CONFIG.ENTRY_TYPES.UPPER_BOUND).length,
            entriesWithBestMove: entries.filter(e => e.bestMove !== null).length
        };
        return { ...stats, analysis };
    }

    /**
     * Resize the table (recreates all clusters)
     */
    resize(newSize) {
        if (newSize < Cluster_Size * 2) {
            throw new Error(`Cache size must be at least ${Cluster_Size * 2} entries`);
        }
        this.size = 1 << Math.floor(Math.log2(newSize / Cluster_Size));
        this.mask = (this.size - 1) & -Cluster_Size;
        this.table = Array.from({ length: this.size }, () => []);
        this.clear();
    }

    /**
     * Probe for a raw entry (for debugging)
     */
    probe(key) {
        const index = this.getIndex(key);
        const cluster = this.table[index];
        for (let entry of cluster) {
            if (entry.key === key) return { ...entry };
        }
        return null;
    }

    /**
     * Cache efficiency metrics and recommendations
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
     * Export table state for analysis (truncated for readability)
     */
    exportState() {
        const entries = this.table.flat().map((entry) => ({
            key: entry.key.substring(0, 20) + '...',
            depth: entry.depth,
            type: entry.type,
            age: Math.floor((Date.now() - entry.date) / 1000),
            accessCount: entry.accessCount,
            hasBestMove: entry.bestMove !== null
        }));
        return {
            timestamp: new Date().toISOString(),
            stats: this.getStats(),
            entries: entries.slice(0, 100) // Limit to 100 for display
        };
    }

    /**
     * Memory usage estimation (rough)
     */
    getMemoryUsage() {
        const entrySize = 100; // Estimate per entry in bytes
        const totalEntries = this.table.reduce((sum, c) => sum + c.length, 0);
        const totalMemory = totalEntries * entrySize;
        return {
            entries: totalEntries,
            estimatedBytes: totalMemory,
            estimatedKB: Math.floor(totalMemory / 1024),
            estimatedMB: (totalMemory / (1024 * 1024)).toFixed(2)
        };
    }
}
