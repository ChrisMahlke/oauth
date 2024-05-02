## Description

This application is a Node.js server implementing an OAuth 2.0 authentication flow, specifically tailored to integrate
with GitHub as an OAuth provider. This setup is used to securely authenticate users and access their GitHub profile
information under their consent. Here’s a more detailed breakdown of how the application functions:

### Application Functionality

1. **Secure Server Communication**:
	- The application uses HTTPS to ensure all data transmitted between the client (user's browser) and the server is encrypted. This is facilitated by SSL/TLS certificates specified in the configuration file.
	- The server listens on a specific port (configurable in `config.json`) for incoming connections.

2. **OAuth 2.0 Authentication Flow**:
	- **User Redirection for Authentication**: When a user initiates the OAuth process (typically by visiting a specific URL endpoint on your server, e.g., `/az/oidc`), the server constructs a URL to redirect the user to GitHub's authorization endpoint. This URL includes parameters such as the client ID, requested scopes (permissions), and a redirect URI to which GitHub will send the user after authentication.
	- **State Parameter**: A `state` parameter is generated using a UUID function for each OAuth transaction to prevent CSRF (Cross-Site Request Forgery) attacks. This state is sent as part of the OAuth request and verified once the user is redirected back to ensure the response corresponds to the request made.
	- **Authorization Code Retrieval**: After the user logs in to GitHub and consents to the permissions, GitHub redirects them back to your application (to the `redirect` URI) with an authorization code. This code is short-lived and secure.
	- **Token Exchange**: The application then exchanges this authorization code for an access token using GitHub's token endpoint. This part of the flow involves server-to-server communication, enhancing security by handling sensitive information such as the client secret in a secure environment.
	- **Access User Information**: Once the access token is obtained, it is used to request user profile data from GitHub. This information is fetched from GitHub's user information endpoint and can include details such as the user's GitHub username, public profile info, and email, depending on the scopes requested.

3. **Error Handling**:
	- The application includes error handling throughout the OAuth process. This includes managing errors that might occur if the user denies consent, if GitHub responds with an error, or if there are issues with the token request or user information request.

4. **Configuration Flexibility**:
	- The `config.json` allows the application to switch easily between using GitHub-specific credentials and generic OAuth credentials, making the application versatile in its authentication strategy. This is particularly useful for supporting different environments or multiple OAuth providers.

5. **User Experience**:
	- Users are provided with a seamless authentication experience that integrates directly with GitHub, allowing them to leverage their existing GitHub accounts to interact with your application.
	- Upon successful authentication, the user’s data retrieved from GitHub can be used within your application to personalize their experience or link their GitHub activities to functionalities offered by your app.

### Overall Purpose and Use Cases

The primary purpose of this application is to provide a secure, reliable, and flexible authentication mechanism using GitHub's OAuth services. This setup is particularly beneficial for applications that need to:
- Ensure users are who they say they are (authentication).
- Obtain permission to act on behalf of users within the scope of permissions granted (authorization).
- Leverage GitHub user data for enhanced functionality, such as for developer tools, dashboard applications, or any service that benefits from integrating user GitHub data.

This OAuth implementation with GitHub is commonly seen in applications aimed at developers or in scenarios where GitHub integration adds significant value to the application's offerings.

## Setup and Running the code

To run the example code, you will need a Node.js environment as it uses Node.js-specific modules like `https`, `fs`,
`os`, and `express`. Here’s a step-by-step guide to get it running:

### Config file

The `config.json` file is the central configuration file that stores various settings required by the Node.js
application to run properly and securely. Each line in this file provides specific configuration details needed for the
setup and operation of the server and OAuth functionality. 

Here's a detailed explanation of each section and line within the `config.json`:

#### Structure and Description of `config.json`

```json
{
  "server": {
    "keyPath": "credentials/server-priv-without-pwd.pem",
    "certPath": "credentials/server-pub.pem",
    "port": 8197
  },
  "oauth": {
    "clientID": "my-client",
    "clientSecret": "dc6277f8-94bd-4a5a-9ef3-4295ae76b0e2",
    "githubClientID": "<Add your OAuth app client ID here>",
    "githubClientSecret": "<Add your OAuth app client secret here>",
    "authorizationEndpoint": "https://github.com/login/oauth/authorize",
    "tokenEndpoint": "https://github.com/login/oauth/access_token",
    "userinfoEndpoint": "https://api.github.com/user"
  },
  "useGithub": true
}
```

#### Server Configuration

- **`keyPath`**: This specifies the path to the SSL/TLS private key file (`server-priv-without-pwd.pem`). This key is essential for encrypting traffic between the server and clients, ensuring secure communication over HTTPS.
- **`certPath`**: This line points to the SSL/TLS certificate file (`server-pub.pem`). The certificate, paired with the private key, allows the server to establish its identity to clients and is used in the TLS handshake process.
- **`port`**: Defines the port number (8197) on which your Node.js server will listen for incoming connections. The port number is configurable so it can be adjusted based on the environment or specific deployment needs.

#### OAuth Configuration

- **`clientID`** and **`clientSecret`**: These credentials are used to authenticate your application with the OAuth provider when **not** using GitHub. They are fundamental in the OAuth flow to secure and differentiate your application's requests.
- **`githubClientID`** and **`githubClientSecret`**: Similar to `clientID` and `clientSecret`, these are specifically for when your application uses GitHub as the OAuth provider, as indicated by the `useGithub` flag.
- **`authorizationEndpoint`**: URL to GitHub's OAuth 2.0 authorization endpoint. This is where your application redirects users to authenticate and authorize access to their GitHub account.
- **`tokenEndpoint`**: URL to GitHub's token endpoint. After users authorize your application, this endpoint is used to exchange the authorization code for an access token.
- **`userinfoEndpoint`**: The URL endpoint to retrieve user information from GitHub once the application has obtained an access token. This is used to access GitHub user profile data.

#### Feature Toggle

- **`useGithub`**: A boolean flag that indicates whether to use GitHub-specific client IDs and secrets. This allows for easy switching between using GitHub as the OAuth provider or another provider by simply toggling this flag and using the corresponding client credentials.

#### Usage in Application

- **Server Setup**: The `keyPath` and `certPath` are used to configure HTTPS for your server, enabling secure connections. The `port` configures where your server listens, crucial for access and network configurations.
- **OAuth Flow**: The `clientID`, `clientSecret`, `authorizationEndpoint`, `tokenEndpoint`, and `userinfoEndpoint` are critical in handling the OAuth flow, from redirecting users for authentication to fetching their profile data post-authentication.
- **Dynamic Configuration**: The `useGithub` flag allows your application logic to adapt based on whether GitHub is the OAuth provider, making your application flexible to changes in how it authenticates users.

This `config.json` file centralizes important configurations, making the application easier to manage, secure, and adapt to different environments or conditions.

### Step 1: Install Node.js

If you don’t already have Node.js installed, you can download and install it from [Node.js official website](https://nodejs.org/). This will also install `npm`, which is Node's package manager.

### Step 2: Set Up Your Project

1. **Create a new directory** for your project and navigate into it:
   ```bash
   mkdir myproject
   cd myproject
   ```

2. **Initialize a new Node.js project**:
   ```bash
   npm init -y
   ```

3. **Install Express**:
   ```bash
   npm install express
   ```

4. **Create your project files**:
	- Create a JavaScript file named `app.js` (or whatever you prefer).

### Step 3: Prepare the Credentials

The project uses TLS/SSL for HTTPS, which requires a private key and a certificate:

- You need to have `server-priv-without-pwd.pem` and `server-pub.pem` files in a `credentials` directory. If you don’t have these, you will need to create them. You can generate these using OpenSSL or any similar tool.

#### Step 3a: Steps to Prepare the Credentials

To generate the PEM files (`server-priv-without-pwd.pem` for the private key and `server-pub.pem` for the public certificate) required for SSL/TLS encryption, you can use OpenSSL. OpenSSL is a robust, commercial-grade, and full-featured toolkit for the Transport Layer Security (TLS) and Secure Sockets Layer (SSL) protocols. It's also a general-purpose cryptography library.

Here’s a step-by-step guide on how to generate these files using OpenSSL:

#### Step 3b: Install OpenSSL

If you don't already have OpenSSL installed, you can download and install it from [OpenSSL's official website](https://www.openssl.org/) or via a package manager for your operating system.

#### Step 3c: Generate a Private Key

Open your command line interface and run the following command to create a private key:

```bash
openssl genrsa -out server-priv-without-pwd.pem 2048
```
This command generates a 2048-bit RSA private key and outputs it to a file named `server-priv-without-pwd.pem`.

#### Step 3d: Generate a Certificate Signing Request (CSR)

Using the private key, generate a CSR. While generating the CSR, you will be prompted to enter details that will be incorporated into your certificate request:

```bash
openssl req -new -key server-priv-without-pwd.pem -out server.csr
```
You'll need to answer questions about the domain name and your organization. For testing purposes, you can input your localhost or domain name when asked for the "Common Name."

#### Step 3e: Generate a Self-Signed Certificate

Now, generate a self-signed certificate using the CSR. This certificate will be valid for 365 days; you can change the number of days as needed:

```bash
openssl x509 -req -days 365 -in server.csr -signkey server-priv-without-pwd.pem -out server-pub.pem
```
This command takes the CSR (`server.csr`), signs it with the private key (`server-priv-without-pwd.pem`), and generates a certificate (`server-pub.pem`) valid for 365 days.

#### Step 3f: Clean Up

You might want to delete the CSR file if it's no longer needed, as your certificate and private key are now ready:

```bash
rm server.csr
```

### Step 4: Configure Your Node.js Application

Make sure the paths to the private key and certificate in your Node.js application point to where you've stored `server-priv-without-pwd.pem` and `server-pub.pem`.

Using these steps, you can create the necessary PEM files to set up HTTPS for your application. If you plan to deploy this application to a production environment, you should consider obtaining a certificate from a recognized Certificate Authority (CA) instead of using a self-signed certificate.

### Step 5: Adjust the Code (if necessary)

Make sure the file paths and other user-specific details (like GitHub OAuth credentials and the specific port number) are correct as per your environment.

### Step 6: Run Your Code

Run your Node.js application using:

```bash
node app.js
```

This should start an HTTPS server using Express and set up the routes as defined in your code. You can then navigate to the URL it prints in the console to interact with the application.

### Additional Notes

- Make sure the ports you are using (like 4443 or 8197) are open and available on your machine.
- The application is set up to authenticate with GitHub via OAuth; ensure your GitHub client ID and secret are valid and correspond to an OAuth application configured in your GitHub settings.

This should get your application up and running! If you encounter any specific errors during setup or execution, feel free to ask for further assistance.

### FAQ

Can the code for handling OAuth with GitHub be adapted to work with other OAuth providers like Google, Facebook, or any other service that adheres to the OAuth 2.0 standard? Yes! However, to make it work with these providers, you'll need to make several modifications specific to each service's OAuth implementation details. Here are the general steps and considerations for adapting the existing Node.js OAuth implementation to other providers:

#### 1. **Configuration Adjustments**

You'll need to update the `config.json` or your configuration management strategy to include credentials and endpoints specific to each OAuth provider:
- **Client ID and Client Secret**: These are provided by the OAuth provider when you register your application with them. Each provider will have a different process for creating and managing these credentials.
- **Authorization, Token, and User Info Endpoints**: These URLs will differ for each provider and need to be specified in your configuration. For example, Google and Facebook have different endpoint URLs for authorization and token exchange.

#### 2. **Scope Adjustments**

The scopes (permissions) that your application requests must be adapted to those supported by the OAuth provider. Scopes vary between providers and need to be specified according to what data or actions your application requires:
- **Google**: Might include scopes like `https://www.googleapis.com/auth/userinfo.email` to get user email.
- **Facebook**: Uses different scope strings, like `email` to access the user's email address.

#### 3. **Redirection and Callback Handling**

While the basic flow remains the same, some OAuth providers may use slightly different parameters or expect different response types:
- **Error Handling**: The way errors are reported might differ. Some providers use different parameter names or error codes.
- **Callback Parameters**: For instance, some providers might use a different parameter name instead of `code` for the authorization code.

#### 4. **Token Exchange**

The method to exchange an authorization code for an access token is generally similar across providers, but there might be minor differences in required parameters or the structure of the response:
- **Content-Type**: Ensure the content-type in headers matches what the provider expects (typically `application/x-www-form-urlencoded`).
- **Response Parsing**: Token responses might include different fields or formats (e.g., Google includes a `token_type` and `expires_in` field).

#### 5. **User Information Retrieval**

The endpoints and the structure of the data returned by the user info endpoint will differ:
- **Data Structure**: The JSON structure of the user data response can vary significantly. You'll need to adjust how you parse and use this data in your application.

#### Example: Adapting to Google OAuth

Here’s a brief example of how you might begin to adapt your configuration for Google’s OAuth:

```json
{
  "server": {
    "keyPath": "credentials/server-priv-without-pwd.pem",
    "certPath": "credentials/server-pub.pem",
    "port": 8197
  },
  "oauth": {
    "clientID": "your-google-client-id.apps.googleusercontent.com",
    "clientSecret": "your-google-client-secret",
    "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenEndpoint": "https://oauth2.googleapis.com/token",
    "userinfoEndpoint": "https://openidconnect.googleapis.com/v1/userinfo"
  }
}
```

#### Considerations for Adaptation

- **Testing**: Thoroughly test the OAuth flow with each provider to handle any provider-specific quirks or issues.
- **Security**: Ensure that the `state` parameter is used to protect against CSRF attacks and consider additional security practices recommended by each OAuth provider.
- **Documentation**: Review the OAuth provider’s documentation for any specific requirements or recommendations.

By carefully adjusting these elements, you can leverage your existing OAuth implementation to authenticate users across different platforms, enhancing the flexibility and user reach of your application.