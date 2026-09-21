from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class VersionedJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        result = super().authenticate(request)

        if result is None:
            return None

        user, validated_token = result

        token_version = validated_token.get("token_version")

        if token_version is None:
            raise AuthenticationFailed("Token version missing.")

        if token_version != user.token_version:
            raise AuthenticationFailed("Token has been revoked.")

        return user, validated_token