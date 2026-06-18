from fastapi import APIRouter, UploadFile, File, HTTPException
from supabase import create_client, Client
import uuid
import mimetypes
from app.core.config import settings

router = APIRouter(prefix="/upload", tags=["Uploads"])

@router.post("/{bucket_name}")
async def upload_file(bucket_name: str, file: UploadFile = File(...)):
    """Handles dynamic file uploads to any specified Supabase bucket."""
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        file_bytes = await file.read()
        
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
        return {"url": public_url}
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))