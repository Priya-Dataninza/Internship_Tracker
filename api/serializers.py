from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework import serializers
from api.models import Applications


class APILoginSerializer(TokenObtainPairSerializer):

    username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['token_version'] = user.token_version  # Include the token version in the payload     

        return token

class ApplicationSerializer(serializers.ModelSerializer):
    internship_applied = serializers.SerializerMethodField()

    class Meta:
        model = Applications
        fields = [
            "id",
            "internship_applied",
            "applied_on",
            "notes",
            "interview_date",
            "status",
        ]

    def get_internship_applied(self, obj):
        internship = obj.internship_applied

        return {
            "id": internship.id,
            "job_title": internship.job_title,
            "company_name": internship.company_name,
            "location": internship.location,
            "description": internship.description,
            "apply_link": internship.apply_link,
            "hosted_url": internship.hosted_url,
            "posted_at": internship.posted_at,
        }