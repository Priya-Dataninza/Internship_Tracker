from django.core.management.base import BaseCommand

from api.services.internship_sync import (
    sync_lever_company,
    sync_greenhouse_company,
)


class Command(BaseCommand):
    help = "Sync internship opportunities from Lever and Greenhouse"

    def handle(self, *args, **options):

        self.stdout.write(
            self.style.WARNING("Starting internship synchronization...")
        )

        # -------------------------
        # Lever companies
        # -------------------------

        lever_companies = [
            {
                "slug": "drivetrain",
                "name": "Drivetrain",
            },
            {
                            "slug": "paytm",
                            "name": "Paytm",
                        },
            {
                            "slug": "hevodata",
                            "name": "Hevo Data",
                        },
            {
                            "slug": "100ms",
                            "name": "100ms",
                        },
        ]

        # -------------------------
        # Greenhouse companies
        # -------------------------

        greenhouse_companies = [
            {
                "board_token": "gitlab",
                "name": "GitLab",

            },
             {
                            "board_token": "cloudflare",
                            "name": "Cloudflare",
            
                        },

             {
                            "board_token": "datadog",
                            "name": "DataDog",
            
                        },

             {
                            "board_token": "mongodb",
                            "name": "MongoDB",
            
                        },

        ]

        total_synced = 0

        # -------------------------
        # Sync Lever
        # -------------------------

        for company in lever_companies:

            self.stdout.write(
                f"Syncing Lever: {company['name']}..."
            )

            count = sync_lever_company(
                company["slug"],
                company["name"],
            )

            total_synced += count

            self.stdout.write(
                self.style.SUCCESS(
                    f"{company['name']}: {count} jobs synced"
                )
            )

        # -------------------------
        # Sync Greenhouse
        # -------------------------

        for company in greenhouse_companies:

            self.stdout.write(
                f"Syncing Greenhouse: {company['name']}..."
            )

            count = sync_greenhouse_company(
                company["board_token"],
                company["name"],
            )

            total_synced += count

            self.stdout.write(
                self.style.SUCCESS(
                    f"{company['name']}: {count} jobs synced"
                )
            )

        # -------------------------
        # Finished
        # -------------------------

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSynchronization complete. "
                f"Total jobs synced: {total_synced}"
            )
        )