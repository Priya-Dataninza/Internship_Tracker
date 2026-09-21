from django.urls import path
from api import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import SecureTokenRefreshView

urlpatterns = [
    path('auth/login/',views.APILoginView.as_view(),name="api_login"),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.SecureTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.APILogoutView.as_view(), name='api_logout'),
    path('internships/',views.internship_list,name="internships"),
    path('applications/',views.ApplicationListView.as_view(),name="applications_list"),
    path("profile/", views.ProfileAPIView.as_view(), name="profile-api"),
    path( "dashboard/", views.DashboardAPIView.as_view(), name="dashboard-api" ),
]


