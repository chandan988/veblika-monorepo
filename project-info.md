# Backend Assist Project Overview

## Applications

- **apps/backend-assist-web**: Frontend application
- **apps/backend-assist-api**: Backend API
- **apps/widget-ui**: Chat widget UI
- **apps/auth**: Centralized authentication (user collection managed here)

## Project Purpose

Backend Assist is a support system for organizations to manage customer communications via email and web chat. It enables organizations to create teams, manage members and roles, and efficiently handle support tickets from multiple channels.

## Core Features

### Organization & Members

- Organizations are created by an owner (admin role of user not member , user data managed in centralized auth).
- Owners or users with appropriate permissions can invite members to join their organization.
- Role management supports Owner and Member roles, as well as dynamic roles with customizable permissions.

### Ticketing System

- **Email Integration**: 
  - Gmail integration via webhooks, using Google Pub/Sub (topics and subscriptions) and Gmail API (configured via Google Console).
  - Incoming emails are automatically converted into tickets.
  - Users can view ticket details and reply to emails directly from the ticket page.
- **Web Chat Integration**:
  - A chat widget script can be embedded into any web application.
  - The widget opens a chatbot interface for real-time communication.
  - Web chat conversations are managed as tickets in the UI. In the backend, both Gmail tickets and widget tickets are stored as conversations in the database, differentiated by channel.

### Data Model

- **Contact**: Represents a customer, identified by email (from Gmail) or phone number (from web chat).
- **Conversation**: Each contact can have multiple conversations (tickets or chats).
- **Message**: Each conversation contains multiple messages.

### Ticket & Chat Management

- Tickets and chats can have statuses: Open, Closed, Pending.
- Tickets and chats (conversations) can be assigned to specific team members.

### Real-Time Communication

- Uses socket rooms for real-time updates and communication.
- Agents can interact with customers in real time via web chat.

### Chat Widget

- The chat widget is rendered using an iframe.
- Can be embedded into any website for instant customer support.

---

This architecture enables organizations to manage both email and chat-based support from a unified platform, with real-time capabilities, flexible integration, and robust role-based access control.