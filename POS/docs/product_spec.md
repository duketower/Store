# POS Product Spec

## Goal

Provide a practical grocery store POS that works reliably in the browser, even with unstable internet.

## Core Users

- Store owner
- Manager
- Cashier

## Core Capabilities

- Billing with barcode support
- Inventory and batch handling
- Customer ledger and credit tracking
- Daily operations and reporting
- Receipt printing
- Optional scale integration
- Optional Firebase-backed sync/auth flows

## Product Constraints

- Must work offline after initial load
- Must stay usable for small Indian grocery stores
- Must support white-label client builds without exposing source code
