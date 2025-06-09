import json
import os
from typing import List, Dict

import requests

LISTINGS_FILE = "listings.json"

BOLIGA_URL = (
    "https://api.boliga.dk/api/search/v2/results?zipCodeFrom=1800&zipCodeTo=2000"
    "&propertyType=Ejerlejlighed&sort=created&order=desc"
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ApartmentTracker/1.0)"
}

def scrape_listings() -> List[Dict]:
    """Scrape latest listings from Boliga.dk."""
    try:
        response = requests.get(BOLIGA_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching listings: {e}")
        return []

    try:
        data = response.json()
    except ValueError:
        print("Failed to parse JSON response")
        return []

    listings = []
    for item in data.get("results", []):
        listings.append({
            "address": item.get("address"),
            "price": item.get("price"),
            "size": item.get("size"),
            "url": item.get("url"),
        })
    return listings

def load_previous_listings() -> List[Dict]:
    if not os.path.exists(LISTINGS_FILE):
        return []
    with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_listings(listings: List[Dict]):
    with open(LISTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(listings, f, ensure_ascii=False, indent=2)

def compare_listings(old: List[Dict], new: List[Dict]) -> List[Dict]:
    old_set = {item["url"] for item in old}
    return [item for item in new if item.get("url") not in old_set]

def notify(new_listings: List[Dict]):
    if not new_listings:
        print("No new listings found")
        return
    print("New listings:")
    for listing in new_listings:
        addr = listing.get("address")
        price = listing.get("price")
        size = listing.get("size")
        url = listing.get("url")
        print(f"- {addr} | {price} | {size} m² | {url}")

def main():
    current = scrape_listings()
    if not current:
        return
    previous = load_previous_listings()
    new_items = compare_listings(previous, current)
    if new_items:
        save_listings(current)
    notify(new_items)

if __name__ == "__main__":
    main()
