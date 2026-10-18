"""Local OCR for document photos. No image is sent to a third party."""
from functools import lru_cache
from io import BytesIO
import warnings

import numpy as np
from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_PIXELS = 20_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS


@lru_cache(maxsize=1)
def get_ocr():
    from rapidocr_onnxruntime import RapidOCR
    return RapidOCR(intra_op_num_threads=1, inter_op_num_threads=1)


def image_text(data: bytes) -> str:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(data)) as image:
                if image.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise HTTPException(415, 'Choose a JPEG, PNG, or WebP document photo.')
                if image.width * image.height > MAX_PIXELS:
                    raise HTTPException(413, 'Document photos must be at most 20 megapixels.')
                image.load()
                pixels = np.array(ImageOps.exif_transpose(image).convert('RGB'))
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(413, 'Document photos must be at most 20 megapixels.') from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(422, 'Cannot read this photo. Choose a clear JPEG, PNG, or WebP image.') from exc
    try:
        result, _ = get_ocr()(pixels)
    except Exception as exc:
        raise HTTPException(503, 'Local photo OCR is unavailable. Install the ML requirements and restart the document service.') from exc
    # The bundled recognition model handles printed Latin text; Hindi script is not supported.
    text = '\n'.join(line[1] for line in (result or []) if line[2] >= 0.5)
    if len(text.strip()) < 30:
        raise HTTPException(422, 'Not enough readable text. Try a brighter, straight-on photo of printed English or Spanish text, or attach a text-selectable PDF. Hindi-script photo OCR is not supported.')
    return text[:150_000]
