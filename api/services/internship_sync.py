import requests

from django.db import transaction
from datetime import datetime
from django.utils import timezone
from api.models import Internship

def sync_lever_company(slug, company_name):
   
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"

    try:
        response = requests.get(
            url,
            timeout=15
        )

        response.raise_for_status()

        jobs = response.json()

    except requests.RequestException as e:
        print(f"Lever API error for {company_name}: {e}")
        return 0

    if not isinstance(jobs, list):
        print(f"Unexpected Lever response for {company_name}")
        return 0

    active_source_ids = set()
    synced_count = 0

    for job in jobs:

        source_id = job.get("id")

        if not source_id:
            continue

        active_source_ids.add(source_id)

        categories = job.get("categories") or {}

        location = (
            categories.get("location")
            or ", ".join(categories.get("allLocations") or [])
            or ""
        )

        description = (
            job.get("descriptionPlain")
            or job.get("descriptionBodyPlain")
            or ""
        )

        apply_link = job.get("applyUrl") or ""
        hosted_url = job.get("hostedUrl") or ""

        created_at = job.get("createdAt")

        posted_at = None

        if created_at:
            try:
                posted_at = datetime.fromtimestamp(
                    created_at / 1000,
                    tz=timezone.UTC
                )
            except (TypeError, ValueError, OSError):
                posted_at = None

        Internship.objects.update_or_create(
            source="lever",
            source_id=source_id,

            defaults={
                "job_title": job.get("text") or "Untitled Position",
                "company_name": company_name,
                "location": location,
                "description": description,
                "apply_link": apply_link,
                "hosted_url": hosted_url,
                "posted_at": posted_at,
                "is_active": True,
            }
        )

        synced_count += 1

    # Mark jobs that disappeared from the API as inactive
    Internship.objects.filter(
        source="lever",
        company_name=company_name,
    ).exclude(
        source_id__in=active_source_ids
    ).update(
        is_active=False
    )

    return synced_count


from bs4 import BeautifulSoup
def clean_html_description(html_content):
    if not html_content:
        return ""

    soup = BeautifulSoup(html_content, "html.parser")

    return soup.get_text(
        separator="\n",
        strip=True
    )

def sync_greenhouse_company(board_token, company_name):

    list_url = (
        f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"
    )

    try:
        response = requests.get(
            list_url,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()

    except requests.RequestException as e:
        print(f"Greenhouse API error for {company_name}: {e}")
        return 0

    jobs = data.get("jobs", [])

    if not isinstance(jobs, list):
        print(f"Unexpected Greenhouse response for {company_name}")
        return 0

    active_source_ids = set()
    synced_count = 0

    for job in jobs:

        source_id = job.get("id")

        if not source_id:
            continue

        active_source_ids.add(str(source_id))

        # -------------------------------------------------
        # Fetch complete job details
        # -------------------------------------------------

        detail_url = (
            f"https://boards-api.greenhouse.io/v1/boards/"
            f"{board_token}/jobs/{source_id}"
        )

        try:
            detail_response = requests.get(
                detail_url,
                timeout=15
            )

            detail_response.raise_for_status()

            job_details = detail_response.json()

        except requests.RequestException as e:
            print(
                f"Could not fetch Greenhouse job "
                f"{source_id}: {e}"
            )
            continue

        # -------------------------------------------------
        # Location
        # -------------------------------------------------

        location_data = job.get("location") or {}

        location = location_data.get("name") or ""

        # -------------------------------------------------
        # Description
        # -------------------------------------------------

        description = (
            clean_html_description(job_details.get("content"))
            or ""
        )

        # -------------------------------------------------
        # Apply URL
        # -------------------------------------------------

        apply_link = (
            job.get("absolute_url")
            or ""
        )

        # -------------------------------------------------
        # Posted date
        # -------------------------------------------------

        first_published = job.get("first_published")

        posted_at = None

        if first_published:
            try:
                posted_at = datetime.fromisoformat(
                    first_published.replace("Z", "+00:00")
                )
            except (TypeError, ValueError):
                posted_at = None

        # -------------------------------------------------
        # Save / update internship
        # -------------------------------------------------

        Internship.objects.update_or_create(

            source="greenhouse",

            source_id=str(source_id),

            defaults={

                "job_title": (
                    job.get("title")
                    or "Untitled Position"
                ),

                "company_name": company_name,

                "location": location,

                "description": description,

                "apply_link": apply_link,

                "hosted_url": apply_link,

                "posted_at": posted_at,

                "is_active": True,
            }
        )

        synced_count += 1

    # -----------------------------------------------------
    # Mark removed jobs as inactive
    # -----------------------------------------------------

    Internship.objects.filter(
        source="greenhouse",
        company_name=company_name,
        source_id__isnull=False,
    ).exclude(
        source_id__in=active_source_ids
    ).update(
        is_active=False
    )

    return synced_count