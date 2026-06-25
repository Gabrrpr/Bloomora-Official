from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from supabase import create_client, Client
import uuid
import mimetypes
from app.core.config import settings
from app.core.dependencies import require_staff
from app.models import User

router = APIRouter(prefix="/upload", tags=["Uploads"])

@router.post("/{bucket_name}")
async def upload_file(
    bucket_name: str,
    file: UploadFile = File(...),
    _: User = Depends(require_staff),
):
    """Handles dynamic file uploads to any specified Supabase bucket."""
    try:
        if bucket_name not in {"advertisements", "hero-images", "products"}:
            raise HTTPException(status_code=400, detail="Unsupported upload bucket.")
        if not file.content_type or not (
            file.content_type.startswith("image/") or file.content_type in {"video/mp4", "video/webm"}
        ):
            raise HTTPException(status_code=400, detail="Only images, MP4, and WebM files are supported.")
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        file_bytes = await file.read()
        if len(file_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Feed media must be 25 MB or smaller.")
        
        # Generate a safe, unique filename
        ext = mimetypes.guess_extension(file.content_type) or ".png"
        filename = f"{uuid.uuid4()}{ext}"
        
        # Upload to Supabase
        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type, "x-upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        display_url = public_url
        if bucket_name == "advertisements":
            try:
                signed = supabase.storage.from_(bucket_name).create_signed_url(filename, 60 * 60 * 24 * 7)
                display_url = signed.get("signedURL") or signed.get("signedUrl") or public_url
            except Exception:
                display_url = public_url
        return {"url": display_url, "storage_path": filename}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
