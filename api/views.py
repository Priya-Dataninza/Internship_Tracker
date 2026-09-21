from django.http import HttpResponse
from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import APILoginSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError,InvalidToken
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import api_view,permission_classes


from api.models import Internship,Applications

from api.serializers import ApplicationSerializer

from django.contrib.auth import get_user_model


User = get_user_model()

class SecureTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            # Let Simple JWT execute standard token rotation and blacklist checks first
            return super().post(request, *args, **kwargs)
        except InvalidToken as e:
            # THIS TRAP ONLY FIRES ON AN ACT OF BREACH (Token Reuse Detected!)
            raw_token = request.data.get("refresh")
            if raw_token:
                try:
                    # Decode the compromised token to trace the user ID
                    token = RefreshToken(raw_token)
                    user_id = token.get('user_id')
                    
                    # KILL SWITCH: Increment version in the database to brick the thief's access tokens
                    user = User.objects.get(id=user_id)
                    user.token_version += 1
                    user.save()
                    print(f"🚨 SECURITY ALERT: Token reuse detected for {user.email}. Family invalidated.")
                except Exception:
                    pass
            
            # Re-raise the standard error so the frontend gets a clean 401 response
            raise e


# Create your views here.
class APILoginView(TokenObtainPairView):
    serializer_class = APILoginSerializer


class APILogoutView(APIView):

    def post(self, request):
        refresh_token = request.data.get("refresh")
        logout_all_devices = request.data.get("logout_all_devices", False)

        if logout_all_devices in (True, "true", "True", "1", 1):
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            request.user.revoke_tokens(reason="logout_all_devices")

            if refresh_token:
                try:
                    RefreshToken(refresh_token).blacklist()
                except TokenError:
                    pass

            return Response(
                {"message": "Logged out from all devices."},
                status=status.HTTP_200_OK
            )

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logout successful."},
                status=status.HTTP_200_OK
            )

        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )






@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def internship_list(request):
    internships = Internship.objects.filter(
        is_active=True
    ).order_by("-posted_at")

    data = []

    for internship in internships:
        data.append({
            "id": internship.id,
            "job_title": internship.job_title,
            "company_name": internship.company_name,
            "location": internship.location,
            "description": internship.description,
            "apply_link": internship.apply_link,
            "hosted_url": internship.hosted_url,
            "source": internship.source,
            "source_id": internship.source_id,
            "posted_at": internship.posted_at, ###need to take care of that acc to time
            "is_active": internship.is_active,
        })

    return Response(data)




class ApplicationListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        applications = (
            Applications.objects
            .filter(applicant=request.user)
            .select_related("internship_applied")  ##solves n+1 problem 
            .order_by("-applied_on")
        )

        serializer = ApplicationSerializer(
            applications,
            many=True
        )

        return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from home.models import Profile


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = Profile.objects.get_or_create(
            user=request.user
        )

        return Response({
            "id": profile.id,
            "full_name": profile.full_name,
            "phone": profile.phone,
            "bio": profile.bio,
            "college": profile.college,
            "degree": profile.degree,
            "branch": profile.branch,
            "graduation_year": profile.graduation_year,
            "linkedin": profile.linkedin,
            "github": profile.github,
            "portfolio": profile.portfolio,
        })




from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from home.models import Profile


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import  Applications  # Make sure to import your Applications model
from home.models import Profile


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Calculate profile completion metric
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        profile_fields = [
            profile.full_name, profile.phone, profile.college,
            profile.degree, profile.branch, profile.graduation_year,
            profile.linkedin, profile.github, profile.portfolio,
        ]

        completed_fields = sum(bool(field) for field in profile_fields)
        profile_completion = round((completed_fields / len(profile_fields)) * 100)

        # 2. DYNAMIC LOOKUPS: Query real user application counts
        # Fetches counts dynamically based on your custom status fields
        total_apps = Applications.objects.filter(applicant=request.user).count()
        
        # Adjust the status text filters ("Interview Scheduled", "Offer Extended", "Rejected")
        # to match the exact string choices defined in your Applications model status choices
        interview_count = Applications.objects.filter(applicant=request.user, status="Interview Scheduled").count()
        offer_count = Applications.objects.filter(applicant=request.user, status="Offer Extended").count()
        rejected_count = Applications.objects.filter(applicant=request.user, status="Rejected").count()
        applied_count = Applications.objects.filter(applicant=request.user, status="Applied").count()
        assessment_count = Applications.objects.filter(applicant=request.user, status="Assessment").count()

        # 3. FETCH RECENT HISTORY: Pull the last 3 applications submitted by this user
        # Uses select_related to cleanly optimize the SQL query and avoid N+1 lags
        recent_apps_queryset = (
            Applications.objects.filter(applicant=request.user)
            .select_related("internship_applied")
            .order_by("-applied_on")[:3]
        )

        recent_applications = [
            {
                "id": app.id,
                "job_title": app.internship_applied.job_title,
                "company_name": app.internship_applied.company_name,
                "status": app.status,
                "applied_on": app.applied_on.strftime("%b %d, %Y")
            }
            for app in recent_apps_queryset
        ]

        return Response({
            "full_name": profile.full_name or request.user.username,
            "email": request.user.email,
            "profile_completion": profile_completion,
            
            # Now fully dynamic based on real database records
            "statistics": {
                "applications": total_apps,
                "interviews": interview_count,
                "offers": offer_count,
                "rejected": rejected_count,
            },
            
            "pipeline": {
                "applied": applied_count,
                "assessment": assessment_count,
                "interview": interview_count,
                "offer": offer_count,
                "rejected": rejected_count,
            },
            
            "upcoming_interviews": [],  # Can filter by interview_date > timezone.now() later
            "recent_applications": recent_applications,
            "recommended_internships": [],
        })
