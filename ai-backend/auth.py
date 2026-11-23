import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.concurrency import run_in_threadpool

bearer_scheme = HTTPBearer(auto_error=False)
AUTH_REQUIRED = os.getenv("VERCEL") == "1" or os.getenv("HR_ADMIN_AUTH_REQUIRED", "").lower() == "true"


def _supabase_settings():
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase authentication is not configured.")
    return url.rstrip("/"), key


def _get_json(url: str, headers: dict[str, str]):
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def _verify_admin(token: str):
    base_url, publishable_key = _supabase_settings()
    headers = {"apikey": publishable_key, "Authorization": f"Bearer {token}", "Accept": "application/json"}
    try:
        user = _get_json(f"{base_url}/auth/v1/user", headers)
    except HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(status_code=401, detail="Your sign-in has expired. Please sign in again.")
        raise HTTPException(status_code=503, detail="Could not verify your Supabase sign-in.")
    except (URLError, TimeoutError, OSError):
        raise HTTPException(status_code=503, detail="Supabase Auth is temporarily unavailable.")

    user_id = user.get("id") if isinstance(user, dict) else None
    if not user_id:
        raise HTTPException(status_code=401, detail="A valid Supabase sign-in is required.")

    query = urlencode({"select": "user_id", "user_id": f"eq.{user_id}", "limit": "1"})
    try:
        admins = _get_json(f"{base_url}/rest/v1/hr_admins?{query}", headers)
    except HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(status_code=403, detail="HR administrator access is required.")
        raise HTTPException(status_code=503, detail="Could not check HR administrator access.")
    except (URLError, TimeoutError, OSError):
        raise HTTPException(status_code=503, detail="Supabase access checks are temporarily unavailable.")

    if not isinstance(admins, list) or not admins:
        raise HTTPException(status_code=403, detail="HR administrator access is required.")
    return user


async def require_hr_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if not AUTH_REQUIRED:
        return {"local_development": True}
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Supabase access token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await run_in_threadpool(_verify_admin, credentials.credentials)
