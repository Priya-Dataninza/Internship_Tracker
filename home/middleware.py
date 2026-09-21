from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from rest_framework import status

class TokenVersionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()

    def __call__(self, request):
        # Only intercept requests heading to your data endpoints
        if request.path.startswith('/api/') and not request.path.startswith('/api/token/refresh/'):
            try:
                # Extract and validate the Bearer token header
                header = self.jwt_authenticator.get_header(request)
                if header:
                    raw_token = self.jwt_authenticator.get_raw_token(header)
                    validated_token = self.jwt_authenticator.get_validated_token(raw_token)
                    
                    # Fetch live user data and extracted JWT version claim
                    user = self.jwt_authenticator.get_user(validated_token)
                    token_version_in_jwt = validated_token.get('token_version')

                    # THE SHIELD: Compare versions. Block request instantly on mismatch.
                    if token_version_in_jwt != user.token_version:
                        return JsonResponse(
                            {"detail": "Session has been invalidated. Please log in again."},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
            except Exception:
                # If the token is corrupted or expired, let default DRF authentication throw the error
                pass

        return self.get_response(request)
