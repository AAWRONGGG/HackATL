from fastapi.testclient import TestClient
import fitz
from ml.backend.main import app, candidate_fields

client = TestClient(app)

def create_pdf(text):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 60), text, fontsize=10)
    data = doc.tobytes()
    doc.close()
    return data

def test_health():
    assert client.get('/health').status_code == 200

def test_analysis_with_real_model():
    contents = 'Georgia Sales and Use Tax Return. Business tax filing and taxable sales. ' * 6
    response = client.post('/api/analyze-document', files={'file': ('tax.pdf', create_pdf(contents), 'application/pdf')})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['document_type'] in ['business_registration', 'food_service_permit', 'tax_document']
    assert isinstance(body['extracted_fields'], dict)
    assert body['requires_review'] is True

def test_field_candidates():
    fields = candidate_fields('Business Name: Sample Cafe LLC\nExpiration Date: 05/01/2027\nPermit Number: TEST-12345')
    assert fields['business_name']['value'] == 'Sample Cafe LLC'
    assert fields['expiration_date']['value'] == '05/01/2027'
    assert fields['document_number']['value'] == 'TEST-12345'

def test_reject_non_pdf():
    resp = client.post('/api/analyze-document', files={'file': ('note.txt', b'not pdf', 'text/plain')})
    assert resp.status_code == 415


def test_missing_file():
    response = client.post('/api/analyze-document')
    assert response.status_code == 422


def test_invalid_pdf_contents():
    response = client.post('/api/analyze-document', files={'file': ('invalid.pdf', b'not a PDF', 'application/pdf')})
    assert response.status_code == 415


def test_corrupt_pdf():
    response = client.post('/api/analyze-document', files={'file': ('corrupt.pdf', b'%PDF-1.7\ninvalid', 'application/pdf')})
    assert response.status_code == 422
    assert 'Cannot read PDF' in response.json()['detail']


def test_pdf_without_selectable_text():
    response = client.post('/api/analyze-document', files={'file': ('scan.pdf', create_pdf(''), 'application/pdf')})
    assert response.status_code == 422
    assert 'OCR' in response.json()['detail']


def test_oversized_pdf():
    response = client.post('/api/analyze-document', files={'file': ('large.pdf', b'%PDF-' + b' ' * (10 * 1024 * 1024), 'application/pdf')})
    assert response.status_code == 413


def test_local_frontend_cors():
    for origin in ['http://localhost:5173', 'http://127.0.0.1:5173']:
        response = client.options('/api/analyze-document', headers={
            'Origin': origin, 'Access-Control-Request-Method': 'POST',
        })
        assert response.status_code == 200
        assert response.headers['access-control-allow-origin'] == origin
