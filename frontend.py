from flask import Flask, render_template_string

from check_listings import (
    scrape_listings,
    load_previous_listings,
    save_listings,
)

app = Flask(__name__)

TEMPLATE = """
<!doctype html>
<title>Apartment Tracker</title>
<h1>Latest Listings</h1>
{% if listings %}
<ul>
{% for item in listings %}
    <li>
        <a href="{{ item.url }}">{{ item.address }}</a> |
        Price: {{ item.price }} |
        Size: {{ item.size }} m²
    </li>
{% endfor %}
</ul>
{% else %}
<p>No listings found.</p>
{% endif %}
"""

@app.route("/")
def index():
    listings = load_previous_listings()
    if not listings:
        listings = scrape_listings()
        if listings:
            save_listings(listings)
    return render_template_string(TEMPLATE, listings=listings)

@app.route("/refresh")
def refresh():
    listings = scrape_listings()
    if listings:
        save_listings(listings)
    return render_template_string(TEMPLATE, listings=listings)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
