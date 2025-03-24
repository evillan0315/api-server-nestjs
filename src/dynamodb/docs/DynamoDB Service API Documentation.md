# DynamoDB Service Documentation

## Overview
The `DynamoDBService` provides an abstraction layer over AWS DynamoDB operations using the AWS SDK for JavaScript (v3) and is integrated with NestJS. This service enables interaction with DynamoDB for storing, retrieving, listing, and managing data tables.

### **Dependencies**
- `@nestjs/common`
- `@nestjs/swagger`
- `@aws-sdk/client-dynamodb`
- `dotenv`

### **Authentication**
This service uses AWS credentials from environment variables:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_TABLE_NAME`

---

## **Service Methods**

### **1. Store a Command in DynamoDB**
#### **Method Signature**
```typescript
async storeCommand(command: string): Promise<void>
```
#### **Description**
Stores a command in the specified DynamoDB table with a unique timestamp.

#### **Request Body**
```json
{
  "command": "sudo apt update"
}
```
#### **Response**
- **201 Created**: Command stored successfully.

---

### **2. Retrieve Stored Commands**
#### **Method Signature**
```typescript
async getStoredCommands(): Promise<any>
```
#### **Description**
Retrieves all stored commands from the DynamoDB table.

#### **Response**
```json
{
  "commands": [
    { "command": "sudo apt update", "timestamp": "2025-03-25T10:00:00Z" },
    { "command": "ls -la", "timestamp": "2025-03-25T10:05:00Z" }
  ]
}
```
- **200 OK**: Successfully retrieved stored commands.

---

### **3. Create a New DynamoDB Table**
#### **Method Signature**
```typescript
async createTable(
  tableName: string,
  keySchema: any,
  attributeDefinitions: any,
  provisionedThroughput: any
): Promise<void>
```
#### **Description**
Creates a new table in DynamoDB with the provided schema.

#### **Request Body**
```json
{
  "tableName": "Users",
  "keySchema": [{ "AttributeName": "userId", "KeyType": "HASH" }],
  "attributeDefinitions": [{ "AttributeName": "userId", "AttributeType": "S" }],
  "provisionedThroughput": { "ReadCapacityUnits": 5, "WriteCapacityUnits": 5 }
}
```
#### **Response**
- **201 Created**: Table successfully created.
- **400 Bad Request**: Invalid request parameters.

---

### **4. List All DynamoDB Tables**
#### **Method Signature**
```typescript
async listTables(): Promise<{ tableNames: string[] }>
