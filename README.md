# Property Calculator

A comprehensive property cost calculator for Indian real estate that helps users calculate the total cost of ownership, including government charges, loan calculations, EMI, and provides comparison features between multiple properties.

## Features

### Core Functionality
- **Property Cost Calculation**: Calculate total property costs for both builder and resale properties
- **Flexible Input Modes**:
  - Calculated mode (price per sq ft + area + parking)
  - Direct mode (total deal value)
- **Government Charges**: Automatic calculation of stamp duty, registration fees, and GST
- **State-Specific Rates**: Pre-configured rates for different Indian states
- **Loan Calculations**:
  - LTV (Loan-to-Value) based on RBI tier guidelines
  - EMI calculations with customizable interest rates and tenure
  - Total interest and loan payment breakdown
- **Property Comparison**: Side-by-side comparison of multiple properties
- **User Authentication**: Optional user accounts to save and manage properties
- **Anonymous Mode**: Use the calculator without creating an account

### Key Calculations
- Agreement Value (White Component)
- Black Component tracking
- GST (for builder properties, with affordable housing rates)
- Stamp Duty (state-specific)
- Registration Fees
- Down Payment
- Total Out-of-Pocket Cost
- Monthly EMI
- Total Cost of Ownership
- Cost per Sq Ft analysis

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts
- **Authentication**: Custom implementation with bcrypt
- **Container**: Docker & Docker Compose

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14 or higher
- Docker (optional, for containerized deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd property_calculator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/property_calculator?schema=public"
```

### 4. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start a PostgreSQL database on port 5432.

#### Option B: Using Local PostgreSQL

Ensure PostgreSQL is running and create a database named `property_calculator`.

### 5. Run Database Migrations

```bash
npm run db:push
```

### 6. Seed the Database (Optional)

```bash
npm run db:seed
```

This will populate the database with default state charges for various Indian states.

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with default data
- `npm run db:studio` - Open Prisma Studio for database management

## Project Structure

```
property_calculator/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   └── properties/ # Property CRUD operations
│   ├── compare/       # Property comparison page
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/        # React components
│   └── ui/           # UI components
├── contexts/          # React contexts
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
│   ├── calculations.ts # Property calculation logic
│   ├── constants.ts   # App constants
│   ├── db.ts          # Database client
│   ├── storage.ts     # Local storage utilities
│   └── types.ts       # TypeScript types
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Database seeding
└── docker-compose.yml # Docker configuration
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create new property
- `GET /api/properties/[id]` - Get property by ID
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property
- `POST /api/properties/migrate` - Migrate local storage to database

### State Charges
- `GET /api/state-charges` - Get state-specific charges

## Database Schema

### Key Models

- **User**: User accounts with authentication
- **Property**: Property details and calculations
- **StateCharges**: State-specific government charges and rates
- **Session**: Session management for anonymous users

## Features in Detail

### Property Types
1. **Builder Properties**: New constructions with GST applicable
2. **Resale Properties**: Pre-owned properties without GST

### LTV Tiers (RBI Guidelines)
The calculator automatically applies appropriate LTV rates based on property value tiers.

### State-Specific Charges
Pre-configured rates for:
- Stamp Duty (varies by state)
- Registration Fees
- GST rates for affordable vs standard housing
- Metro surcharges where applicable

### Customization
Users can override default values for:
- GST Rate
- Stamp Duty Rate
- Registration Fee
- LTV Rate
- Interest Rate
- Loan Tenure

## Docker Deployment

Build and run with Docker:

```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
