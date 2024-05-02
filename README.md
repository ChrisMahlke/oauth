To run the example code, you will need a Node.js environment as it uses Node.js-specific modules like `https`, `fs`, `os`, and `express`. Here’s a step-by-step guide to get it running:

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