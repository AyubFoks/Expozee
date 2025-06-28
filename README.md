# Expozee - A Governance Accountability Tracker

![Expozee Logo](./uploads/expozee_purple.svg?width=200px)

## Presentation Video

[Watch the presentation](./uploads/demo.mp4)

## Project Description

Expozee is a web application that tracks and exposes governance failures, corruption cases, and mismanagement in public institutions. It allows citizens to anonymously report issues while providing transparency through a public database of reported cases.

Key Features:
- Secure anonymous reporting system
- Interactive dashboard of reported cases
- Filterable database of governance issues
- Rich text editor for detailed reports
- Responsive design for all devices

## Setup and Installation

### Prerequisites

- Terminal
- VS Code (recommended IDE)

### Getting Started

1. **Clone the repository**

Open your terminal and clone this repository

```bash
git clone https://github.com/AyubFoks/Expozee.git
cd Expozee
```
2. **Open in VS Code**

```bash
code .
```

3. **Install dependencies**

Open the inbuilt VS Code Terminal and run the following to install dependencies.
```bash
npm install -g json-server
npm install
```

4. **Start the development environment**

Open another terminal window and start the json-server:
```bash
json-server --watch db.json --port 3001
```

### Running the Application

1. Open the index.html
2. Right click on an empty space inside the file and click "Open with Live Server"
3. Open with browser.
4. The application should now be running. Both the main application and mock API.

## Project Structure

```
Expozee/
├── css/
│   └── styles.css            # Main stylesheet
├── src/
│   └── index.js              # Javascript file
├── uploads/                  # Assets directory
├── counties.json             # Kenya Counties data
├── db.json                   # Database file
├── index.html                # Main HTML file
└── README.md                 # Instructions (this file)
```

## Development Workflow (VS Code)

1. Open the project in VS Code
2. Use the built-in terminal (Ctrl+`) to run commands
3. Recommended VS Code extension:
   - Live Server

## API Endpoints

This application uses these endpoints from the mock API:

- `GET /reports` - Get all reports
- `POST /reports` - Create new report
- `GET /counties` - Get county data

## Author

**Ayub Foks**  
- GitHub: [Ayub Karanja](https://github.com/AyubFoks)
- Email: ayubfoks@live.com

## License

This project is licensed under the MIT License.