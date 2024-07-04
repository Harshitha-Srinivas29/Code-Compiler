# Online Code Compiler

An online code compiler built with React.js for the frontend and Express.js for the backend. This project allows users to write, compile, and execute code in C, C++, Python, and Java with syntax highlighting and online execution.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Approach](#approach)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Basic knowledge of HTML, CSS, and JavaScript
- Basic knowledge of React.js
- Basic knowledge of APIs, Express.js, and Node.js

## Project Structure

```
online-code-compiler/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── app.js
│   │   └── ...
│   ├── package.json
│   └── ...
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── ...
│   ├── package.json
│   └── ...
├── README.md
└── ...
```

## Installation

### Backend

1. Navigate to the `backend` directory:

```bash
cd backend
```

2. Install the dependencies:

```bash
npm install
```

### Frontend

1. Navigate to the `frontend` directory:

```bash
cd frontend
```

2. Install the dependencies:

```bash
npm install
```

## Running the Application

### Backend

1. Start the backend server:

```bash
npm start
```

The backend server will run on `http://localhost:5000`.

### Frontend

1. Start the frontend development server:

```bash
npm start
```

The frontend will run on `http://localhost:3000`.

## Features

- Write code in C, C++, Python, and Java
- Syntax highlighting for code
- Compile and execute code online
- Display output and errors

## Approach

The application is divided into two main parts:

1. **Frontend (React.js)**: Consists of three main sections:
   - **Text Editor**: To write code with syntax highlighting
   - **Input Box**: To provide input for the code
   - **Output Box**: To display the output and errors

2. **Backend (Express.js)**: Implements an API to compile and execute the code received from the frontend. The logic for handling different programming languages and executing the code securely is implemented here.

## Usage

1. Open the application in your browser (`http://localhost:3000`).
2. Select the programming language from the dropdown.
3. Write your code in the text editor.
4. Provide any necessary input in the input box.
5. Click the "Run" button to compile and execute the code.
6. The output or any errors will be displayed in the output box.

## Future Enhancements

- Add more programming languages
- Implement user authentication and authorization
- Save and load code snippets
- Enhance security and sandboxing of code execution
- Improve UI/UX
