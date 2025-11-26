# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Install any needed packages
RUN npm install

# Copy entrypoint script and make it executable
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Bundle app source
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define the command to run the app using the entrypoint script
CMD ["/bin/sh", "entrypoint.sh"]
