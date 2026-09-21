import requests

GREENHOUSE_BOARDS = {
    "MongoDB": "mongodb",
    "GitLab": "gitlab",
    "Cloudflare": "cloudflare",
    "Datadog": "datadog",
}

for company, BOARD_TOKEN in GREENHOUSE_BOARDS.items():
    url = f"https://boards-api.greenhouse.io/v1/boards/{BOARD_TOKEN}/jobs"

    response = requests.get(url, timeout=10)

    print("Status Code:", response.status_code)
    print(f"Company: {company} | Board Token: {BOARD_TOKEN}")

    if response.status_code == 200:
        data = response.json()

        print("API is working!")
        print("Total jobs:", len(data.get("jobs", [])))

        for job in data.get("jobs", [])[:3]:
            print("\n--------------------")
            print("ID:", job.get("id"))
            print("Title:", job.get("title"))
            print("Location:", job.get("location", {}).get("name"))
            print("Apply:", job.get("absolute_url"))

    else:
        print("API request failed!")
        print("Response:", response.text)

import requests
import json

LEVER_COMPANIES = {
    "Drivetrain": "drivetrain",
    "Paytm": "paytm",
    "Hevo Data": "hevodata",
    "100ms": "100ms",
}

for company, company_slug in LEVER_COMPANIES.items():

    url = f"https://api.lever.co/v0/postings/{company_slug}?mode=json"


    response = requests.get(url, timeout=10)

    print("Status:", response.status_code)
    print(f"Company: {company} | Company Slug: {company_slug}")

    if response.status_code == 200:
        jobs = response.json()

        print("API working!")
        print("Total jobs:", len(jobs))

        for job in jobs[:1]:

            print("\n========== COMPLETE JOB DATA ==========\n")

            print("ID:")
            print(job.get("id"))

            print("\nTEXT / TITLE:")
            print(job.get("text"))

            print("\nCATEGORIES:")
            print(json.dumps(job.get("categories"), indent=4))

            print("\nLOCATION:")
            print(job.get("categories", {}).get("location"))

            print("\nCOMMITMENT:")
            print(job.get("categories", {}).get("commitment"))

            print("\nDESCRIPTION:")
            print(job.get("description"))

            print("\nHOSTED URL:")
            print(job.get("hostedUrl"))

            print("\nAPPLY URL:")
            print(job.get("applyUrl"))
            print(response.text)

        else:
            print("API request failed!")
            print("Response:", response.text)

