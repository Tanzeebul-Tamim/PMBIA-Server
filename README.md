# PMBIA - Server Side
Welcome to the server-side repository of the PMBIA (Professional Mountain Biking Instructors' Association) website. It is responsible for handling API requests and managing the database functionalities.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Live Server](#live-server)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Also checkout PMBIA-Client](#also-checkout-pmbia-client)
- [Contributing](#contributing)

## Features

- CRUD operations for users and items.
- Database interactions using MongoDb.
- Environment-based configuration.
- Search and sort functionality for instructors and courses

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JSON Web Token (JWT)

## Prerequisites

- Node.js and npm installed.
- MongoDB installed and running.

## Project Structure

```
├── .gitignore          # Lists files for Git to ignore
├── README.md           # Project documentation
├── index.js            # Main entry point of the application
├── package.lock.json   # Exact dependency tree
├── package.json        # Project metadata and dependencies
├── vercel.json         # Vercel deployment settings
```

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Tanzeebul-Tamim/PMBIA-Server
    cd PMBIA-Server
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root of the `server` directory and add the following environment variables:

```
PORT=5000
DB_USER=your_db_user
DB_PASS=your_db_password
MONGODB_URI=your_mongodb_connection_string
```

## Live Server

The server is deployed on [this following URL](https://summer-camp-school-server-ivory.vercel.app/)

## Running the Application

- Start the server:
    ```bash
    npm start
    ```

## API Endpoints

### Users
- ***PUT*** `users/:email`: Save user in db
- ***GET*** `users/:email`: Get a single user by email

### Instructors
- ***GET*** `/instructors`: Get all instructors
- ***GET*** `/instructors/total`: Get how many instructor accounts have been registered
- ***GET*** `/instructors/top`: Get top 6 instructors & the number of their total students
- ***GET*** `/instructors/:id`: Get a single instructor by ID
- ***PUT*** `/instructor/updateStudentCount`: Update instructors available seat

### Classes
- ***GET*** `/classes`: Get all classes
- ***GET*** `/classes/total`: Get the total number of classes
- ***GET*** `/classes/top`: Get top 6 classes

### Bookings
- ***PUT*** `/book-class`: Post a booking
- ***GET*** `/book-class/:studentId`: Get user bookings
- ***GET*** `/book-class/:studentId/:itemId`: Get a booking
- ***DELETE*** `/book-class/:studentId/:itemId`: Delete a booking
- ***DELETE*** `/booking/:studentId`: Delete all bookings of a user

### Payment
- ***POST*** `/create-payment-intent`: Create payment intent

## Also checkout PMBIA-Client
Visit the client-side repository of the [PMBIA](https://github.com/Tanzeebul-Tamim/PMBIA-Client) website

## Contributing

Feel free to contribute by submitting a pull request. Please ensure that your code follows the project's coding standards and includes relevant tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
