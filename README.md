# Apartment Tracker

This project fetches apartment listings from Boliga.dk and saves them to
`listings.json`. A small Flask web app is included so you can view the
latest listings in your browser.

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the web front-end

Start the server with:

```bash
python frontend.py
```

Visit [http://localhost:8000](http://localhost:8000) to see the saved
listings. Use `/refresh` in your browser to fetch the latest data.
