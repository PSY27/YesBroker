import requests

url = "http://127.0.0.1:8000/search"
payload = {
    "area": "Indiranagar",
    "pincode": "560037",
    "max_rent": 35000,
    "bhk": "2",
    "office": "Embassy GolfLinks",
    "power_backup": False,
    "non_veg": False
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response JSON:")
try:
    results = response.json()
    print(f"Number of results: {len(results)}")
    for r in results:
        print(f"- ID: {r.get('id')}, Title: {r.get('title')}, Rent: {r.get('rent')}, Score: {r.get('score')}")
except Exception as e:
    print("Failed to parse response:", e)
    print(response.text)
