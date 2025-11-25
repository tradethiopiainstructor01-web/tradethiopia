# Backend API for Portal

## Overview
This is the backend API for the Portal application, built with Node.js, Express, and MongoDB.

## New Package Tracking Functionality

### Package Management for B2B Marketplace

We've implemented package tracking functionality to interconnect the B2B marketplace management page with the customer follow-up page. This allows tracking of purchased packages for both buyers and sellers without using packages as a matching criterion.

#### Data Model Updates

- **Buyer Model**: Added a `packageType` field (similar to customer follow-up) and a `packages` array field to track detailed purchased packages
- **Seller Model**: Added a `packageType` field (similar to customer follow-up) and a `packages` array field to track detailed purchased packages

Each package contains:
- `packageName`: Name of the purchased package
- `packageType`: Type of package (e.g., Premium, Gold)
- `purchaseDate`: Date when the package was purchased
- `expiryDate`: Date when the package expires
- `status`: Current status (Active, Expired, Cancelled)

#### Frontend Updates

- **Buyer Form**: Added package type dropdown selection (numbers 1-8, matching customer follow-up page)
- **Seller Form**: Added package type dropdown selection (numbers 1-8, matching customer follow-up page)
- **Match Details**: Added display of package type for both buyers and sellers (e.g., "Package 3")

#### API Endpoints

##### Buyer Management
- `POST /api/buyers` - Create a buyer with package type
- `PUT /api/buyers/:id` - Update a buyer with package type

##### Seller Management
- `POST /api/sellers` - Create a seller with package type
- `PUT /api/sellers/:id` - Update a seller with package type

##### Buyer Package Management
- `POST /api/buyers/:id/packages` - Add a package to a buyer
- `PUT /api/buyers/:id/packages/:packageId` - Update a package for a buyer
- `DELETE /api/buyers/:id/packages/:packageId` - Remove a package from a buyer

##### Seller Package Management
- `POST /api/sellers/:id/packages` - Add a package to a seller
- `PUT /api/sellers/:id/packages/:packageId` - Update a package for a seller
- `DELETE /api/sellers/:id/packages/:packageId` - Remove a package from a seller

#### Matching Algorithm

The B2B matching algorithm has been explicitly designed to NOT use packages as a matching criterion. The matching is based solely on:
- Industry match
- Country match
- Product match (what buyers want vs what sellers offer)

#### Frontend Integration

Package information is displayed in the MatchDetails component for both buyers and sellers, showing:
- Package type as a colored badge (e.g., "Package 3")
- Detailed package information in the packages array
- Package status with color-coded badges
- Expiry information

#### Integration with Customer Follow-up

The package tracking functionality connects the B2B marketplace with the customer follow-up page by:
1. Storing package type information directly with buyer/seller records (similar to customer follow-up)
2. Tracking detailed package purchase information in the packages array
3. Displaying package information in match details
4. Allowing customer service representatives to track what packages customers have purchased
5. Enabling better customer service by understanding what services customers have access to

For detailed implementation information, see [package-functionality-documentation.md](package-functionality-documentation.md)