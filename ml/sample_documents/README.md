# BizBridge document-review test PDFs

Every generated PDF is clearly labeled fictional/test-only. None is a valid registration, permit, tax authorization, or compliance document.

Scores below were returned by the real /api/analyze-document endpoint. They are uncalibrated model scores, not accuracy percentages. No model or application code was changed.

| File | Predicted category | Model score | Example type |
|---|---|---|---|
| sample_business_registration.pdf | business_registration | 34.6% | New synthetic example |
| sample_food_service_permit.pdf | food_service_permit | 38.2% | New synthetic example |
| sample_tax_document.pdf | tax_document | 37.6% | New synthetic example |
| training_based_business_registration.pdf | business_registration | 47.3% | Training-based reference; not independent evaluation |
| training_based_food_service_permit.pdf | food_service_permit | 49.5% | Training-based reference; not independent evaluation |
| training_based_tax_document.pdf | tax_document | 49.5% | Training-based reference; not independent evaluation |

All six generated PDFs were classified into their intended categories, and business name, address, document number, issue date, expiration date, and date candidates were detected. This is a small functional check, not an estimate of real-world accuracy.

Start with the training_based PDFs for stronger scores. They include a fictional cover with extractable fields plus an existing training form. The sample_ PDFs are independently written synthetic examples and return lower scores.

To test: AI Assistant > choose a PDF > Review Document. Open Analysis details for its actual score. Review fields before enabling sharing with Gemini.

Even original training documents score only approximately 50% under the current model. Generating a sample cannot promise a 76% score; that would require improving and evaluating the classifier.
