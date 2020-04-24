import {} from '@airtasker/spot'

export interface ValidationErrorResponse {
  success: false
  error: {
    message: 'REQUEST_VALIDATION_ERROR'
    errors: {
      keyword: string
      dataPath: string
      schemaPath: string
      propertyName?: string
    }
  }
}
