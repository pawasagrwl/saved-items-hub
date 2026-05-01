# Saved Items Hub

Saved Items Hub is a modern, responsive web application and data pipeline designed to help you organize, filter, and view your saved Reddit posts and comments. 

The project is split into two main parts:
1. **Data Fetcher (`api/`)**: A Python script that connects to your Reddit account using PRAW, fetches all your saved items, categorizes them, and outputs them into a structured JSON file.
2. **Web Dashboard (`src/`)**: A sleek React application built with Vite, TypeScript, Tailwind CSS, and shadcn/ui that visualizes your saved items with advanced filtering, collections, and insights.

## Features

- **Automated Fetching**: Python script to seamlessly fetch and update your saved Reddit items.
- **Rich Dashboard**: Modern UI with dark/light mode support, optimized for both desktop and mobile.
- **Advanced Filtering**: Filter your saved items by type (Posts vs. Comments), subreddits, date ranges, and upvotes.
- **Collections & Bulk Actions**: Organize your items into custom collections and perform bulk operations.
- **Insights**: View statistics about your saved items (e.g., top subreddits, vote distributions).
- **One-Click Deploy**: Easy deployment to GitHub Pages.

## Project Structure

```text
saved-items-hub/
├── api/                  # Python backend for data fetching
│   ├── fetchItems.py     # Main Reddit API scraper
│   ├── requirements.txt  # Python dependencies
│   ├── .env_example      # Example environment variables
│   └── README.md         # Detailed instructions for the fetcher
├── src/                  # React frontend source code
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context (App, BulkSelect)
│   ├── pages/            # Application pages (Index, NotFound)
│   └── ...
├── public/               # Public assets and the generated saved_items.json
├── package.json          # Node dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## Prerequisites

Before running the application, ensure you have the following installed:
- **Node.js** (v18 or higher) and **npm**
- **Python** (3.6 or higher)
- A **Reddit account** and API credentials.

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
# Install Node.js packages
npm install
```

### 2. Configure Reddit API Credentials

1. Go to [Reddit's App Preferences](https://www.reddit.com/prefs/apps) and create a new "Script" application.
2. Set the redirect URI to `http://localhost:8080`.
3. Note your `client_id` and `client_secret`.
4. Create a `.env` file in the `api/` directory:

```bash
cd api
cp .env_example .env
```

5. Edit `api/.env` with your Reddit credentials:
```env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
```

### 3. Install Backend Dependencies

```bash
# While in the api/ directory
pip install -r requirements.txt
```

## Usage

### Fetching Data

To fetch the latest saved items from Reddit, run the automated `api` script from the root directory. This script runs the Python fetcher, copies the generated JSON file to the `public/` directory, and automatically commits and pushes the new data to your Git repository:

```bash
npm run api
```

*(Note: The first run might take some time as it performs a full sync of your saved items.)*

### Running the App Locally

Start the Vite development server to view the dashboard:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Deploying to GitHub Pages

The project is configured for easy deployment to GitHub Pages. To build and deploy the app:

```bash
npm run deploy
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI & Styling**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React, next-themes
- **Backend / Data Pipeline**: Python, PRAW (Python Reddit API Wrapper)
- **Deployment**: GitHub Pages (`gh-pages`)
