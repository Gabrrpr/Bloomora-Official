import io
import json
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps
from supabase import create_client

from app.core.config import settings


IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
STORAGE_BUCKET = "advertisements"


def _storage():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY).storage.from_(STORAGE_BUCKET)


def create_mobile_content_signed_url(path_or_url: str | None) -> str | None:
    if not path_or_url:
        return None
    if path_or_url.startswith(("http://", "https://")):
        return path_or_url
    response = _storage().create_signed_url(path_or_url, 60 * 60 * 24 * 7)
    return response.get("signedURL") or response.get("signedUrl") or path_or_url


def _upload_bytes(data: bytes, suffix: str, content_type: str) -> str:
    path = f"mobile-content/{uuid.uuid4().hex}{suffix}"
    _storage().upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "x-upsert": "false"},
    )
    return path


async def process_image(file: UploadFile, content_type: str) -> dict:
    maximum = 15 * 1024 * 1024
    source = await file.read(maximum + 1)
    if len(source) > maximum:
        raise HTTPException(status_code=413, detail="Images must be 15 MB or smaller.")
    try:
        with Image.open(io.BytesIO(source)) as opened:
            if getattr(opened, "is_animated", False):
                raise HTTPException(status_code=400, detail="Animated images are not supported.")
            image = ImageOps.exif_transpose(opened).convert("RGB")
            expected = (1440, 2560) if content_type == "feed" else (1080, 500)
            if image.width < expected[0] or image.height < expected[1]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image must be at least {expected[0]} × {expected[1]} pixels.",
                )
            image = ImageOps.fit(image, expected, method=Image.Resampling.LANCZOS)
            output = io.BytesIO()
            quality = 90
            image.save(output, "WEBP", quality=quality, method=6)
            while output.tell() > 2_500_000 and quality > 76:
                quality -= 4
                output = io.BytesIO()
                image.save(output, "WEBP", quality=quality, method=6)
            data = output.getvalue()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="The uploaded image is invalid or corrupted.") from exc
    storage_path = _upload_bytes(data, ".webp", "image/webp")
    return {
        "id": str(uuid.uuid4()),
        "kind": "image",
        "url": create_mobile_content_signed_url(storage_path),
        "storagePath": storage_path,
        "posterUrl": None,
        "posterStoragePath": None,
        "width": expected[0],
        "height": expected[1],
        "durationSeconds": None,
        "mimeType": "image/webp",
        "sizeBytes": len(data),
    }


def _probe_video(path: str) -> dict:
    if not shutil.which("ffprobe"):
        raise HTTPException(status_code=503, detail="Video processing is not installed on this server.")
    command = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration:format=duration",
        "-of", "json", path,
    ]
    try:
        result = subprocess.run(command, capture_output=True, check=True, text=True, timeout=30)
        payload = json.loads(result.stdout)
        stream = payload["streams"][0]
        duration = float(stream.get("duration") or payload.get("format", {}).get("duration") or 0)
        return {"width": int(stream["width"]), "height": int(stream["height"]), "duration": duration}
    except Exception as exc:
        raise HTTPException(status_code=400, detail="The uploaded video is invalid or corrupted.") from exc


async def process_video(file: UploadFile) -> dict:
    maximum = 150 * 1024 * 1024
    if not shutil.which("ffmpeg"):
        raise HTTPException(status_code=503, detail="Video processing is not installed on this server.")
    suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
    with tempfile.TemporaryDirectory(prefix="mobile-content-") as directory:
        source_path = os.path.join(directory, f"source{suffix}")
        output_path = os.path.join(directory, "output.mp4")
        poster_path = os.path.join(directory, "poster.webp")
        total = 0
        with open(source_path, "wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > maximum:
                    raise HTTPException(status_code=413, detail="Videos must be 150 MB or smaller.")
                destination.write(chunk)
        metadata = _probe_video(source_path)
        if metadata["duration"] <= 0 or metadata["duration"] > 30.05:
            raise HTTPException(status_code=400, detail="Videos must be 30 seconds or shorter.")
        if metadata["width"] < 1080 or metadata["height"] < 1920:
            raise HTTPException(status_code=400, detail="Video must be at least 1080 × 1920 pixels.")
        filter_chain = (
            "scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,fps=30,format=yuv420p"
        )
        command = [
            "ffmpeg", "-y", "-i", source_path,
            "-vf", filter_chain,
            "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "18",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
            "-t", "30", output_path,
        ]
        try:
            subprocess.run(command, capture_output=True, check=True, timeout=180)
            subprocess.run(
                ["ffmpeg", "-y", "-ss", "0.2", "-i", output_path, "-frames:v", "1", "-vf", "scale=720:1280", poster_path],
                capture_output=True,
                check=True,
                timeout=60,
            )
        except subprocess.CalledProcessError as exc:
            raise HTTPException(status_code=400, detail="The video could not be optimized.") from exc
        video_bytes = Path(output_path).read_bytes()
        poster_bytes = Path(poster_path).read_bytes()
    video_storage_path = _upload_bytes(video_bytes, ".mp4", "video/mp4")
    poster_storage_path = _upload_bytes(poster_bytes, ".webp", "image/webp")
    return {
        "id": str(uuid.uuid4()),
        "kind": "video",
        "url": create_mobile_content_signed_url(video_storage_path),
        "storagePath": video_storage_path,
        "posterUrl": create_mobile_content_signed_url(poster_storage_path),
        "posterStoragePath": poster_storage_path,
        "width": 1080,
        "height": 1920,
        "durationSeconds": round(metadata["duration"], 2),
        "mimeType": "video/mp4",
        "sizeBytes": len(video_bytes),
    }


async def process_mobile_content_media(file: UploadFile, content_type: str) -> dict:
    if content_type not in {"feed", "banner"}:
        raise HTTPException(status_code=400, detail="Invalid mobile content type.")
    mime = (file.content_type or "").lower()
    if mime in IMAGE_TYPES:
        return await process_image(file, content_type)
    if content_type == "feed" and mime in VIDEO_TYPES:
        return await process_video(file)
    raise HTTPException(status_code=400, detail="Unsupported media format.")
