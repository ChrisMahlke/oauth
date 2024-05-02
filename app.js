'use strict';

// Required Node.js modules
const https = require('https');
const fs = require('fs');
const express = require('express');
const os = require('os');
const url = require('url');
const crypto = require('crypto');

// Load configuration from a JSON file
const config = require('./config.json');

// Conditionally modify configuration if GitHub is used for authentication
if (config.useGithub) {
    config.server.port = 4443;  // Use HTTPS port 4443 for GitHub
    config.oauth.clientID = config.oauth.githubClientID;
    config.oauth.clientSecret = config.oauth.githubClientSecret;
}

// HTTPS server options, reading key and certificate for SSL
const options = {
    key: fs.readFileSync(config.server.keyPath),
    cert: fs.readFileSync(config.server.certPath)
};

// Creating an instance of express application
const app = express();

// Define routes for OAuth process
app.get('/az/oidc', initiateOAuth);
app.get('/redirect', handleOAuthRedirect);
app.get('*', handleDefault);

// Create HTTPS server with TLS options and listen on specified port
const server = https.createServer(options, app);
server.listen(config.server.port, () => {
    console.log(`Server listening at https://${os.hostname()}:${config.server.port}/az/oidc`);
});

// Function to initiate OAuth process
function initiateOAuth(req, res) {
    // Generate a random UUID as state parameter to mitigate CSRF
    const state = crypto.randomUUID();
    // Construct redirect URI dynamically
    const redirectUri = `https://${os.hostname()}:${config.server.port}/redirect`;
    // Construct query parameters for authorization request
    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.oauth.clientID,
        scope: 'openid read:user user:email',
        redirect_uri: redirectUri,
        state: state
    });

    // Build the full URL for redirection to GitHub's OAuth 2.0 server
    const redirectUrl = `${config.oauth.authorizationEndpoint}?${queryParams}`;
    console.log(`Redirecting user to authenticate and provide consent, state: ${state}`);
    // Redirect user agent to GitHub for authentication
    res.redirect(302, redirectUrl);
}

// Function to handle the redirect URI after GitHub authentication
function handleOAuthRedirect(req, res) {
    // Handle any error returned by GitHub
    if (req.query.error) {
        return res.status(400).send(`<h1>Error: ${req.query.error}</h1>`);
    }

    // Check if the authorization code is present
    if (!req.query.code) {
        console.error('No code received');
        return res.status(500).send('<h1>Failed to receive authorization code</h1>');
    }

    // Prepare body data for token request
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: req.query.code,
        client_id: config.oauth.clientID,
        client_secret: config.oauth.clientSecret,
        redirect_uri: `https://${os.hostname()}:${config.server.port}/redirect`
    });

    // Configure request options for token exchange
    const tokenOptions = {
        hostname: url.parse(config.oauth.tokenEndpoint).hostname,
        path: url.parse(config.oauth.tokenEndpoint).pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
    };

    // Create and send HTTPS request for token
    const tokenRequest = https.request(tokenOptions, tokenResponse => {
        let data = '';
        tokenResponse.on('data', chunk => data += chunk);
        tokenResponse.on('end', () => handleUserInfo(data, req, res));
    });

    tokenRequest.on('error', error => {
        console.error('Token request error', error);
        res.status(500).send('<h1>Failed to request token</h1>');
    });

    tokenRequest.write(body.toString());
    tokenRequest.end();
}

// Function to handle user information retrieval using access token
function handleUserInfo(data, req, res) {
    const tokenData = JSON.parse(data);
    if (!tokenData.access_token) {
        console.error('No access token received');
        return res.status(500).send('<h1>Failed to receive access token</h1>');
    }

    // Configure request options for user info request
    const userInfoOptions = {
        hostname: url.parse(config.oauth.userinfoEndpoint).hostname,
        path: url.parse(config.oauth.userinfoEndpoint).pathname,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Node.js Server'
        }
    };

    // Request user information from GitHub
    https.get(userInfoOptions, infoRes => {
        let userData = '';
        infoRes.on('data', chunk => userData += chunk);
        infoRes.on('end', () => res.status(200).contentType('application/json').send(userData));
    }).on('error', error => {
        console.error('User info request error', error);
        res.status(500).send('<h1>Failed to request user information</h1>');
    });
}

// Default handler for any other GET request
function handleDefault(req, res) {
    res.send('<h1>Access the OAuth flow via /az/oidc</h1>');
}
