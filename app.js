'use strict';

const https = require('https');
const fs = require('fs');
const express = require('express');
const os = require('os');
const url = require('url');
const crypto = require('crypto');

// Load configuration
const config = require('./config.json');

// Apply GitHub configuration if useGithub is true
if (config.useGithub) {
    config.server.port = 4443;
    config.oauth.clientID = config.oauth.githubClientID;
    config.oauth.clientSecret = config.oauth.githubClientSecret;
}

const options = {
    key: fs.readFileSync(config.server.keyPath),
    cert: fs.readFileSync(config.server.certPath)
};

const app = express();

// Routes
app.get('/az/oidc', initiateOAuth);
app.get('/redirect', handleOAuthRedirect);
app.get('*', handleDefault);

// Initialize HTTPS server
const server = https.createServer(options, app);
server.listen(config.server.port, () => {
    console.log(`Server listening at https://${os.hostname()}:${config.server.port}/az/oidc`);
});

function initiateOAuth(req, res) {
    const state = crypto.randomUUID();
    const redirectUri = `https://${os.hostname()}:${config.server.port}/redirect`;
    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.oauth.clientID,
        scope: 'openid read:user user:email',
        redirect_uri: redirectUri,
        state: state
    });

    const redirectUrl = `${config.oauth.authorizationEndpoint}?${queryParams}`;
    console.log(`Redirecting user to authenticate and provide consent, state: ${state}`);
    res.redirect(302, redirectUrl);
}

function handleOAuthRedirect(req, res) {
    if (req.query.error) {
        return res.status(400).send(`<h1>Error: ${req.query.error}</h1>`);
    }

    if (!req.query.code) {
        console.error('No code received');
        return res.status(500).send('<h1>Failed to receive authorization code</h1>');
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: req.query.code,
        client_id: config.oauth.clientID,
        client_secret: config.oauth.clientSecret,
        redirect_uri: `https://${os.hostname()}:${config.server.port}/redirect`
    });

    const tokenOptions = {
        hostname: url.parse(config.oauth.tokenEndpoint).hostname,
        path: url.parse(config.oauth.tokenEndpoint).pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
    };

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

function handleUserInfo(data, req, res) {
    const tokenData = JSON.parse(data);
    if (!tokenData.access_token) {
        console.error('No access token received');
        return res.status(500).send('<h1>Failed to receive access token</h1>');
    }

    const userInfoOptions = {
        hostname: url.parse(config.oauth.userinfoEndpoint).hostname,
        path: url.parse(config.oauth.userinfoEndpoint).pathname,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Node.js Server'
        }
    };

    https.get(userInfoOptions, infoRes => {
        let userData = '';
        infoRes.on('data', chunk => userData += chunk);
        infoRes.on('end', () => res.status(200).contentType('application/json').send(userData));
    }).on('error', error => {
        console.error('User info request error', error);
        res.status(500).send('<h1>Failed to request user information</h1>');
    });
}

function handleDefault(req, res) {
    res.send('<h1>Access the OAuth flow via /az/oidc</h1>');
}
