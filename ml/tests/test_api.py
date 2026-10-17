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
