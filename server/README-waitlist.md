# WhisprNet.ai Waitlist API

This document outlines the waitlist integration for WhisprNet.ai's landing page.

## Overview

The waitlist system allows users to submit their email addresses via the landing page form. Upon submission, the email is stored in the MongoDB database and an acknowledgment email is sent to the user.

## API Endpoint

- **URL**: `/api/waitlist`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response**:
  - **Code**: 201 CREATED
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Successfully joined the waitlist"
    }
    ```
- **Duplicate Email Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Email already registered"
    }
    ```
- **Error Response**:
  - **Code**: 400 BAD REQUEST (for invalid emails)
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid email format"
    }
    ```
  - **Code**: 500 INTERNAL SERVER ERROR
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Internal server error"
    }
    ```

## Implementation Details

### Backend

1. **Models**: `Waitlist.js` - MongoDB schema for storing waitlist emails
2. **Controllers**: `waitlistController.js` - Handles API request/response logic
3. **Services**: 
   - `waitlistService.js` - Business logic for adding emails to waitlist
   - `emailService.js` - Sends confirmation emails
4. **Routes**: `waitlistRoutes.js` - Defines API routes

### Frontend

The landing page has been modified to:
1. Make API calls to the backend
2. Show loading states during submission
3. Display success/error messages
4. Prevent duplicate submissions

## Email Template

The system sends a confirmation email with the following content:

- **Subject**: 🎉 You're on the WhisprNet.ai Waitlist!
- **Body**: A welcome message thanking the user for joining the waitlist.

## Testing

To test the waitlist integration:
1. Run the backend server
2. Navigate to the landing page
3. Submit an email through the waitlist form
4. Verify the email is stored in the MongoDB database
5. Check that a confirmation email is sent successfully 