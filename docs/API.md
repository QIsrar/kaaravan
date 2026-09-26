# API Documentation

## Introduction

This document outlines the REST API endpoints available under `/api/v1/` for mobile apps and third-party integrations.

### Authentication
- Most endpoints require authentication using a Supabase access token.
- Pass the token in the `Authorization` header: `Authorization: Bearer <supabase access token>`.

### Guest Carts
- For guest interactions (like carts before login), you must provide a guest token.
- Pass the guest token in the `X-Guest-Token` header.
- (On the web, this is typically handled via an `httpOnly` cookie, but mobile relies on this header.)

## Endpoints

*(Endpoints will be added here phase by phase.)*
