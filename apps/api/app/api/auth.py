import re
import uuid
import secrets
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Header, Depends, Response

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str = Field(..., description="Academic or institutional email")
    password: str = Field(..., description="Password (min 6 chars)")
    role: Optional[str] = Field("Lead Researcher", description="Academic role")
    name: Optional[str] = Field(None, description="Full Name")
    institution: Optional[str] = Field("Machine Learning Robustness Laboratory", description="Institution")

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    institution: str
    avatar_seed: str
    token: str

# Registered Verified Institutional Accounts
REGISTERED_RESEARCHERS = {
    "eleanor.bennett@academic-evaluators.org": {
        "password": "evaluator2026!",
        "name": "Prof. Eleanor Bennett",
        "role": "Evaluator / Reviewer",
        "institution": "Department of Computer Science Review Board",
        "avatar_seed": "EB"
    },
    "alex.vance@academic-lab.edu": {
        "password": "researcher2026!",
        "name": "Dr. Alex Vance",
        "role": "Lead Researcher",
        "institution": "Machine Learning Robustness Laboratory",
        "avatar_seed": "AV"
    },
    "chen.wei@stanford-ai.edu": {
        "password": "stanford2026!",
        "name": "Prof. Wei Chen",
        "role": "Professor",
        "institution": "Stanford AI Robustness Group",
        "avatar_seed": "WC"
    },
    "sarah.jenkins@oxford-ml.ac.uk": {
        "password": "oxford2026!",
        "name": "Sarah Jenkins, M.Sc.",
        "role": "Graduate Student",
        "institution": "Oxford Machine Learning Research Group",
        "avatar_seed": "SJ"
    }
}

# In-memory active session token store
ACTIVE_SESSIONS = {}

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@router.post("/login", response_model=UserProfile)
def login(payload: LoginRequest, response: Response):
    email_clean = payload.email.strip().lower()
    pw_clean = payload.password.strip()

    # 1. Validate email format
    if not re.match(EMAIL_REGEX, email_clean):
        raise HTTPException(status_code=400, detail="Invalid institutional email address format.")

    # 2. Validate password length
    if len(pw_clean) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # 3. If pre-registered academic account, strictly verify password
    if email_clean in REGISTERED_RESEARCHERS:
        acc = REGISTERED_RESEARCHERS[email_clean]
        if pw_clean != acc["password"]:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials for verified institutional account. Please check your password."
            )
        name = acc["name"]
        role = acc["role"]
        institution = acc["institution"]
        avatar_seed = acc["avatar_seed"]
    else:
        # Custom institutional researcher
        name = payload.name
        if not name or not name.strip():
            parts = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()
            name = f"Dr. {parts}"
        
        avatar_seed = "".join([part[0] for part in name.split()[:2] if part]).upper()
        if not avatar_seed:
            avatar_seed = "RL"
        role = payload.role or "Lead Researcher"
        institution = payload.institution or "Machine Learning Robustness Laboratory"

    token = f"rl_tok_{secrets.token_hex(24)}"
    user_id = str(uuid.uuid4())

    profile = UserProfile(
        id=user_id,
        name=name,
        email=email_clean,
        role=role,
        institution=institution,
        avatar_seed=avatar_seed,
        token=token
    )

    ACTIVE_SESSIONS[token] = profile.model_dump()
    response.set_cookie(
        key="rl_session_token",
        value=token,
        max_age=86400,
        path="/",
        samesite="lax",
        httponly=False
    )
    return profile

@router.get("/me", response_model=UserProfile)
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header.")
    
    token = authorization.split(" ")[1]
    if token not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please sign in again.")
    
    return UserProfile(**ACTIVE_SESSIONS[token])

@router.get("/validate-token")
def validate_token(token: str):
    if token in ACTIVE_SESSIONS:
        return {"valid": True, "user": ACTIVE_SESSIONS[token]}
    return {"valid": False}

@router.post("/logout")
def logout(response: Response, authorization: Optional[str] = Header(None)):
    response.delete_cookie(key="rl_session_token", path="/")
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        ACTIVE_SESSIONS.pop(token, None)
    return {"message": "Signed out successfully."}
