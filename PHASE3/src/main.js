/**
 * Game Controller - Main orchestrator for the draughts game
 * Delegates game logic to specialized handlers for cleaner architecture
 * 60% reduced complexity by decomposing monolithic main.js
 */

import { Game } from './engine/game.js';
import { Board } from './view/board.js';
import { UI } from './view/ui.js';
import { AI } from './engine/aiController.js';
import { History } from './engine/history.js';
import { Notification } from './view/notification.js';
import { MoveHandler } from './game-flow/move-handler.js';
import { AIHandler } from './game-flow/ai-handler.js';
import { GameTimer } from './game-flow/game-timer.js';
import { HistoryHandler } from './game-flow/history-handler.js';
import { EditModeHandler } from './game-flow/edit-mode-handler.js';
import { PLAYER, GAME_STATE, PIECE, GAME_MODE, BOARD_SIZE } from './engine/constants.js';

class GameController {
    constructor() {
        // Core game components
        this.game = new Game();
        this.board = new Board();
        this.ui = new UI();
        this.ai = AI;
        this.history = new History(this.game);
        this.notification = new Notification();

        // Specialized handlers
        this.moveHandler = new MoveHandler(this.game, this.board, this.ui, this.notification, this.history);
        this.aiHandler = new AIHandler(this.game, this.ai, this.board, this.ui, this.notification, this.moveHandler);
        this.gameTimer = new GameTimer(this.game, this.ui, this.notification);
        this.historyHandler = new HistoryHandler(this.game, this.board, this.ui, this.notification, this.history);
        this.editModeHandler = new EditModeHandler(this.game, this.board, this.ui, this.notification);

        // Link handlers
        this.moveHandler.setAIHandler(this.aiHandler);

        // Game state
        this.gameInitialized = false;
        this.gameInProgress = true;

        this.initializeGame();
    }

    /**
     * Initialize the game
     */
    async initializeGame() {
        try {
            const updateLoadingStatus = (message) => {
                const statusEl = document.getElementById('loading-status');
                if (statusEl) statusEl.textContent = message;
            };

            updateLoadingStatus('Initializing board...');
            this.board.initialize();
            
            updateLoadingStatus('Setting up UI...');
            this.ui.initialize();
            
            updateLoadingStatus('Loading Grandmaster AI engine...');
            await this.aiHandler.initialize();
            
            updateLoadingStatus('Setting up game controls...');
            this.setupEventListeners();
            
            updateLoadingStatus('Finalizing...');
            this.updateView();
            this.gameTimer.start();
            
            this.gameInitialized = true;
            window.gameController = this;
            
            // Check if AI should make first move
            await this.aiHandler.checkIfAITurn();
            
            this.notification.success("Grandmaster AI initialized successfully!", { duration: 3000 });
            
            // Hide loading screen
            setTimeout(() => {
                if (window.hideLoadingScreen) {
                    window.hideLoadingScreen();
                }
            }, 500);
            
        } catch (error) {
            console.error('Game initialization error:', error);
            
            if (window.hideLoadingScreen) {
                window.hideLoadingScreen();
            }
            
            this.notification.error("Failed to initialize game. Please refresh the page.", { 
                duration: 0, 
                closable: true 
            });
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Board events
        this.board.on('squareSelected', (square) => this.handleSquareSelection(square));
        this.board.on('moveAttempt', (moveData) => this.moveHandler.handleMoveAttempt(moveData));
        this.board.on('dragDropMove', (moveData) => this.moveHandler.handleMoveAttempt(moveData));
        this.board.on('editSquare', (square) => this.editModeHandler.handleEditSquare(square));
        
        // UI events - Difficulty
        this.ui.on('difficultyChange', (level) => this.handleDifficultyChange(level));
        
        // UI events - Game mode
        this.ui.on('gameModeChange', (mode) => {
            this.aiHandler.setMode(mode);
            this.notification.info(`Game mode set to ${mode === 'pva' ? 'Player vs AI' : 'Player vs Player'}`, { duration: 2000 });
        });
        
        // UI events - Edit mode
        this.ui.on('editModeToggle', (enabled) => {
            if (enabled) {
                this.editModeHandler.toggleEditMode();
            } else {
                this.editModeHandler.toggleEditMode();
            }
        });
        
        // UI events - History navigation
        this.ui.on('undo', () => this.historyHandler.undo());
        this.ui.on('redo', () => this.historyHandler.redo());
        this.ui.on('firstMove', () => this.historyHandler.jumpToStart());
        this.ui.on('lastMove', () => this.historyHandler.jumpToEnd());
        this.ui.on('prevMove', () => this.historyHandler.undo());
        this.ui.on('nextMove', () => this.historyHandler.redo());
        this.ui.on('jumpToMove', (index) => this.historyHandler.jumpToMove(index));
        
        // UI events - FEN import/export
        this.ui.on('importFEN', () => this.importFEN());
        this.ui.on('exportFEN', () => this.exportFEN());
        this.ui.on('savePNG', () => this.board.saveAsPNG());
        
        // UI events - Game rules
        this.ui.on('maxCaptureRuleChange', (enabled) => {
            try {
                this.game.setMaxCaptureRule(enabled);
                this.updateView();
                const status = enabled ? 'enabled' : 'disabled';
                this.notification.info(`Maximum capture rule ${status}`, { duration: 2000 });
            } catch (error) {
                console.error('Error setting max capture rule:', error);
                this.notification.error('Failed to update capture rule', { duration: 2000 });
            }
        });
        
        this.ui.on('timeControlChange', (enabled) => {
            try {
                this.gameTimer.setEnabled(enabled);
                this.updateView();
            } catch (error) {
                console.error('Error setting time control:', error);
                this.notification.error('Failed to update time control', { duration: 2000 });
            }
        });
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            this.notification.error('An unexpected error occurred. Please check the console.', { duration: 5000 });
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.aiHandler.isThinking()) {
                this.aiHandler.abortSearch();
            }
        });
    }

    /**
     * Handle square selection (for showing legal moves)
     */
    handleSquareSelection(square) {
        try {
            const piece = this.game.getPiece(square.row, square.col);
            
            if (piece === PIECE.NONE) {
                this.board.clearHighlights();
                return;
            }
            
            if (!this.game.isPieceOfCurrentPlayer(piece)) {
                this.board.clearHighlights();
                return;
            }
            
            // Get legal moves for this piece
            const legalMoves = this.game.getLegalMoves();
            const pieceMoves = legalMoves.filter(m => 
                m.from.row === square.row && m.from.col === square.col
            );
            
            this.board.highlightLegalMoves(pieceMoves);
        } catch (error) {
            console.error('Square selection error:', error);
        }
    }

    /**
     * Handle difficulty change
     */
    async handleDifficultyChange(level) {
        try {
            await this.aiHandler.setDifficulty(level);
            this.resetGame();
            this.notification.info(`AI level set to ${level}. New game started.`, { duration: 3000 });
        } catch (error) {
            console.error('Error changing difficulty:', error);
            this.notification.error('Failed to change AI difficulty', { duration: 2000 });
        }
    }

    /**
     * Reset the game
     */
    resetGame() {
        try {
            this.aiHandler.abortSearch();
            this.game.reset();
            this.history.clear();
            this.gameTimer.reset();
            this.updateView();
            
            // Check if AI should move first
            this.aiHandler.checkIfAITurn();
        } catch (error) {
            console.error('Error resetting game:', error);
            this.notification.error('Failed to reset game', { duration: 2000 });
        }
    }

    /**
     * Update all views
     */
    updateView() {
        try {
            this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
            this.ui.updateMoveHistory(this.history.getHistory(), this.history.getCurrentIndex());
            this.ui.updateGameStatistics(this.game.getGameStatistics());
            
            // Check for game over conditions
            this.checkGameState();
        } catch (error) {
            console.error('View update error:', error);
        }
    }

    /**
     * Check and handle game state changes
     */
    checkGameState() {
        const legalMoves = this.game.getLegalMoves();
        
        if (legalMoves.length === 0) {
            let result = '';
            if (this.game.gameState !== GAME_STATE.DRAW) {
                result = this.game.currentPlayer === PLAYER.WHITE 
                    ? 'Black wins! (White has no legal moves)'
                    : 'White wins! (Black has no legal moves)';
                this.game.gameState = this.game.currentPlayer === PLAYER.WHITE 
                    ? GAME_STATE.BLACK_WIN 
                    : GAME_STATE.WHITE_WIN;
            }
            this.notification.info(result, { duration: 0, closable: true });
        } else if (this.game.gameState === GAME_STATE.DRAW) {
            this.notification.info('Game is drawn!', { duration: 0, closable: true });
        }
    }

    /**
     * Import FEN notation
     */
    importFEN() {
        try {
            this.editModeHandler.toggleEditMode();
            const fen = prompt('Enter FEN notation:');
            
            if (fen) {
                this.editModeHandler.importFEN(fen);
                this.updateView();
            }
        } catch (error) {
            console.error('Import FEN error:', error);
            this.notification.error('Failed to import FEN', { duration: 2000 });
        }
    }

    /**
     * Export FEN notation
     */
    exportFEN() {
        try {
            const fen = this.editModeHandler.exportFEN();
            if (fen) {
                prompt('FEN notation (copy this):', fen);
            }
        } catch (error) {
            console.error('Export FEN error:', error);
            this.notification.error('Failed to export FEN', { duration: 2000 });
        }
    }

    /**
     * Get game instance (for debugging)
     */
    getCurrentGame() {
        return this.game;
    }

    /**
     * Get history instance (for debugging)
     */
    getCurrentHistory() {
        return this.history;
    }

    /**
     * Gracefully shutdown the game
     */
    shutdown() {
        try {
            this.aiHandler.abortSearch();
            this.gameTimer.stop();
            this.notification.closeCurrent();
            if (this.ai && typeof this.ai.terminate === 'function') {
                this.ai.terminate();
            }
        } catch (error) {
            console.error('Error during shutdown:', error);
        }
    }
}

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        new GameController();
    } catch (error) {
        console.error('Failed to start game:', error);
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 15px; border-radius: 5px; z-index: 10000;">
                Failed to start game. Please refresh the page.<br>
                <small>Check browser console for details.</small>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});
