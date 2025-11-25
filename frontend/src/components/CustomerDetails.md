# Customer Details Component

## Overview
The CustomerDetails component provides a comprehensive view of buyer and seller information in the B2B marketplace. This component displays all relevant customer information in a clean, organized layout.

## Features
- Detailed view of customer information (company name, contact person, email, phone, etc.)
- Package type display (matching the customer follow-up page format)
- Product listings with tags
- Certifications display (for sellers)
- Requirements display (for buyers)
- Purchased packages with status indicators
- Edit and contact action buttons

## Props
- `customer` (object): The customer data to display
- `customerType` (string): Either 'buyer' or 'seller' to determine display format
- `onBack` (function): Callback function to handle back navigation
- `onEdit` (function): Callback function to handle edit action

## Usage
The component is used in the B2BDashboard.jsx file within a modal dialog. When a user clicks the "View" icon on a buyer or seller in the table, the CustomerDetails component is displayed with the relevant customer information.

## Data Displayed
### Common Information
- Company Name
- Contact Person
- Email
- Phone Number
- Country
- Industry
- Package Type (displayed as "Package X" where X is 1-8)
- Status (Active/Inactive/Suspended)
- Registration Date
- Last Active Date

### Buyer-Specific Information
- Products Looking For
- Requirements

### Seller-Specific Information
- Products Offering
- Certifications

### Package Information
- Purchased Packages (from the packages array)
  - Package Name
  - Package Type
  - Purchase Date
  - Expiry Date
  - Status (Active/Expired/Cancelled)