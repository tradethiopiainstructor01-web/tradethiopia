# Backend API for Portal

## Overview
This is the backend API for the Portal application, built with Node.js, Express, and MongoDB.

## Finance E2E Rollback Tests

Finance rollback tests require MongoDB transaction support, so they must run against a replica set. CI starts a Docker MongoDB replica set automatically and runs:

```bash
npm test
```

`npm test` runs both finance unit tests and the finance E2E rollback suite. In CI, `FINANCE_E2E_MONGO_URI` is required; if it is missing, the E2E test fails instead of skipping.

To run the same tests locally with Docker:

```bash
docker rm -f finance-mongo || true
docker run -d --name finance-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec finance-mongo mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
export FINANCE_E2E_MONGO_URI='mongodb://localhost:27017/tradethiopia_finance_e2e?replicaSet=rs0'
npm run test:finance:e2e
```

PowerShell:

```powershell
docker rm -f finance-mongo
docker run -d --name finance-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec finance-mongo mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
$env:FINANCE_E2E_MONGO_URI = 'mongodb://localhost:27017/tradethiopia_finance_e2e?replicaSet=rs0'
npm run test:finance:e2e
```

The E2E suite intentionally forces failures mid-workflow and verifies no partial invoices, bills, expenses, payments, journals, or ledger balance updates remain after rollback.

## Sales Manager Functionality

### Overview
We've implemented sales manager functionality to provide oversight and management capabilities for sales teams. Sales managers can view all sales across all agents, monitor team performance, and manage sales settings.

### Data Model Updates

- **User Model**: Added `salesmanager` role to the enum list of allowed roles
- **SalesCustomer Model**: No changes required as it already contains all necessary commission and sales data

### API Endpoints

#### Sales Manager Dashboard
- `GET /api/sales-manager/dashboard-stats` - Get dashboard statistics for sales manager

#### All Sales Management
- `GET /api/sales-manager/all-sales` - Get all completed sales from all agents

#### Team Performance
- `GET /api/sales-manager/team-performance` - Get team performance statistics

### Access Control

Only users with the `salesmanager` role can access these endpoints. All endpoints are protected with JWT authentication.

### Frontend Integration

The sales manager functionality is available through a dedicated section in the frontend with:
- Dashboard overview showing key metrics
- All sales page displaying completed sales from all agents
- Team management page for overseeing sales agents
- Performance analytics and reporting
- Settings management for commission rates and targets

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
