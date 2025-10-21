#!/usr/bin/env node

/**
 * VLC Helper Service for Jackett
 * 
 * This service provides a simple HTTP API to launch VLC playback
 * for magnet links and torrent files from Jackett search results.
 * 
 * Requirements:
 * - Node.js installed
 * - VLC installed
 * - peerflix installed globally: npm install -g peerflix
 * 
 * Usage:
 * 1. Run: node vlc-helper.js
 * 2. Keep terminal open while using Jackett
 * 3. Click Play buttons in Jackett search results
 */

const http = require('http');
const { spawn } = require('child_process');
const url = require('url');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 48888;
const MODE = process.env.MODE || 'peerflix'; // 'peerflix' | 'vlc'
const VLC_PATH = process.env.VLC_PATH || getDefaultVlcPath();

// Get default VLC path based on OS
function getDefaultVlcPath() {
    const os = require('os').platform();
    
    switch (os) {
        case 'win32':
            return 'vlc.exe';
        case 'darwin':
            return '/Applications/VLC.app/Contents/MacOS/VLC';
        case 'linux':
            return 'vlc';
        default:
            return 'vlc';
    }
}

// Logging utility
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Play with peerflix (recommended)
function playWithPeerflix(magnet) {
    log(`Starting peerflix playback: ${magnet.substring(0, 50)}...`);
    
    const args = [
        magnet,
        '--vlc',
        '--buffer=1024',
        '--',
        '--play-and-exit',
        '--meta-title=Jackett'
    ];
    
    // Try to find peerflix using multiple methods
    let peerflixCommand = 'peerflix';
    let peerflixPath = null;
    
    // First try: Check if peerflix is in system PATH
    const { execSync } = require('child_process');
    try {
        execSync('peerflix --version', { encoding: 'utf8', stdio: 'ignore' });
        log('Using peerflix from system PATH');
    } catch (error) {
        // Second try: Find peerflix in npm global modules
        try {
            const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
            peerflixPath = path.join(npmRoot, 'peerflix', 'app.js');
            
            const fs = require('fs');
            if (fs.existsSync(peerflixPath)) {
                log(`Using peerflix from npm global modules: ${peerflixPath}`);
                peerflixCommand = 'node';
                args.unshift(peerflixPath);
            } else {
                throw new Error('peerflix not found in npm global modules');
            }
        } catch (npmError) {
            log(`Could not find peerflix: ${npmError.message}`, 'error');
            log('Trying alternative methods...', 'error');
            tryAlternativePeerflix(magnet);
            return;
        }
    }
    
    const peerflix = spawn(peerflixCommand, args, { 
        stdio: 'ignore', 
        detached: true 
    });
    
    peerflix.unref();
    
    peerflix.on('error', (error) => {
        log(`Peerflix error: ${error.message}`, 'error');
        log('Trying alternative methods...', 'error');
        
        // Try alternative approach - use node to run peerflix directly
        tryAlternativePeerflix(magnet);
    });
    
    peerflix.on('spawn', () => {
        log('Peerflix started successfully', 'success');
    });
}

// Alternative peerflix method using node directly
function tryAlternativePeerflix(magnet) {
    log('Trying alternative peerflix method...');
    
    const args = [
        magnet,
        '--vlc',
        '--buffer=1024',
        '--',
        '--play-and-exit',
        '--meta-title=Jackett'
    ];
    
    // Try to find peerflix app.js in npm global modules
    const { execSync } = require('child_process');
    try {
        const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        const peerflixApp = path.join(npmRoot, 'peerflix', 'app.js');
        
        log(`Using peerflix from: ${peerflixApp}`);
        
        const peerflix = spawn('node', [peerflixApp, ...args], { 
            stdio: 'ignore', 
            detached: true 
        });
        
        peerflix.unref();
        
        peerflix.on('error', (error) => {
            log(`Alternative peerflix error: ${error.message}`, 'error');
            log('Falling back to direct VLC mode...', 'error');
            playWithVlc(magnet);
        });
        
        peerflix.on('spawn', () => {
            log('Alternative peerflix started successfully', 'success');
        });
        
    } catch (error) {
        log(`Could not find peerflix app.js: ${error.message}`, 'error');
        log('Falling back to direct VLC mode...', 'error');
        playWithVlc(magnet);
    }
}

// Play with VLC directly
function playWithVlc(magnet) {
    log(`Starting VLC playback: ${magnet.substring(0, 50)}...`);
    
    const args = [
        magnet,
        '--play-and-exit',
        '--meta-title=Jackett',
        '--intf=dummy'
    ];
    
    const vlc = spawn(VLC_PATH, args, { 
        stdio: 'ignore', 
        detached: true 
    });
    
    vlc.unref();
    
    vlc.on('error', (error) => {
        log(`VLC error: ${error.message}`, 'error');
        log(`Make sure VLC is installed at: ${VLC_PATH}`, 'error');
    });
    
    vlc.on('spawn', () => {
        log('VLC started successfully', 'success');
    });
}

// Main server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }
    
    // Health check endpoint
    if (pathname === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('ok');
    }
    
    // Play endpoint
    if (pathname === '/play') {
        const magnet = parsedUrl.query.magnet;
        
        if (!magnet) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Missing magnet parameter');
        }
        
        if (!magnet.startsWith('magnet:?')) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Invalid magnet link');
        }
        
        try {
            if (MODE === 'vlc') {
                playWithVlc(magnet);
            } else {
                playWithPeerflix(magnet);
            }
            
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('launched');
            
        } catch (error) {
            log(`Playback error: ${error.message}`, 'error');
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`error: ${error.message}`);
        }
        
        return;
    }
    
    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
});

// Diagnostic function to check peerflix installation
function checkPeerflixInstallation() {
    log('Checking peerflix installation...');
    
    const { execSync } = require('child_process');
    
    try {
        // Check npm global root
        const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        log(`NPM global root: ${npmRoot}`);
        
        // Check if peerflix exists
        const peerflixPath = path.join(npmRoot, 'peerflix', 'app.js');
        const fs = require('fs');
        
        if (fs.existsSync(peerflixPath)) {
            log(`✅ Peerflix found at: ${peerflixPath}`);
            
            // Try to get peerflix version
            try {
                const version = execSync(`node "${peerflixPath}" --version`, { encoding: 'utf8' }).trim();
                log(`✅ Peerflix version: ${version}`);
            } catch (error) {
                log(`⚠️ Could not get peerflix version: ${error.message}`);
            }
        } else {
            log(`❌ Peerflix not found at: ${peerflixPath}`);
            log('Try reinstalling: npm install -g peerflix');
        }
        
        // Check system PATH for peerflix
        try {
            execSync('peerflix --version', { encoding: 'utf8' });
            log('✅ Peerflix found in system PATH');
        } catch (error) {
            log('⚠️ Peerflix not found in system PATH');
        }
        
    } catch (error) {
        log(`❌ Error checking peerflix: ${error.message}`);
    }
}

// Start server
server.listen(PORT, '127.0.0.1', () => {
    log(`VLC Helper service started on http://127.0.0.1:${PORT}`);
    log(`Mode: ${MODE}`);
    log(`VLC Path: ${VLC_PATH}`);
    log('Ready to receive playback requests from Jackett');
    log('');
    
    // Run diagnostics
    checkPeerflixInstallation();
    
    log('');
    log('To test the service:');
    log(`  curl http://127.0.0.1:${PORT}/ping`);
    log('');
    log('Press Ctrl+C to stop the service');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('Shutting down VLC Helper service...');
    server.close(() => {
        log('Service stopped');
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'error');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
    process.exit(1);
});
