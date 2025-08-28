# Overview

InvoiceManager is a full-stack invoice and expense management application built with a React frontend and Express.js backend. The application allows users to manage customers, create and track invoices, record expenses, and view financial summaries through an intuitive dashboard. It features user authentication, CRUD operations for all entities, and responsive design with Turkish language support.

## Recent Updates (28 Ağustos 2025)

✓ Backend API'leri tam olarak çalışır duruma getirildi
✓ TypeScript hataları düzeltildi (storage.ts)
✓ Müşteri oluşturma API'si test edildi ve çalışıyor
✓ Fatura oluşturma API'si test edildi ve çalışıyor  
✓ Masraf oluşturma API'si test edildi ve çalışıyor
✓ Desktop navigation menüsü eklendi
✓ Responsive tasarım iyileştirildi

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React 18 using TypeScript and follows a component-based architecture:

- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with CSS variables for theming and shadcn/ui component library for consistent design
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers
- **Component Structure**: Modular components organized by feature (Auth, Dashboard, Customers, Invoices, Expenses)

The frontend uses a single-page application (SPA) pattern with component-based navigation and localStorage for user session persistence.

## Backend Architecture
The server-side is built with Express.js and follows RESTful API principles:

- **Framework**: Express.js with TypeScript for API development
- **Data Layer**: Drizzle ORM for database operations with PostgreSQL dialect
- **Storage**: In-memory storage implementation with interface for future database integration
- **Validation**: Zod schemas for request validation and type generation
- **Development**: Vite integration for hot module replacement in development

The backend implements a repository pattern through the IStorage interface, allowing for easy switching between storage implementations.

## Data Storage Solutions
The application uses a dual approach for data persistence:

- **Database**: PostgreSQL configured through Drizzle ORM with schema definitions for users, customers, invoices, and expenses
- **Current Implementation**: In-memory storage for development with full CRUD operations
- **Schema Management**: Drizzle migrations for database version control
- **Connection**: Neon database serverless connection (@neondatabase/serverless)

## Authentication and Authorization
Simple authentication system implemented with:

- **Registration/Login**: Email and password-based authentication
- **Session Management**: User data stored in localStorage on client-side
- **API Protection**: User ID validation for all protected endpoints
- **Password Security**: Plain text storage (development implementation)

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **UI Components**: Radix UI primitives (@radix-ui/*) for accessible component foundations
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **TypeScript**: Full TypeScript support across frontend and backend
- **Build Tools**: Vite for frontend bundling and development server

### Database and ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL database connection
- **Database Migrations**: Drizzle Kit for schema management

### Development Tools
- **Express.js**: Backend API framework with middleware support
- **Wouter**: Lightweight routing library for React
- **Date Management**: date-fns for date formatting and manipulation
- **Validation**: Zod for schema validation and type inference

### UI Enhancement
- **Icons**: Lucide React for consistent iconography
- **Animations**: Class Variance Authority for component variants
- **Accessibility**: Radix UI primitives ensure WCAG compliance
- **Responsive Design**: Tailwind CSS responsive utilities

The application is configured for deployment with both development and production build processes, using ESBuild for server bundling and Vite for client optimization.