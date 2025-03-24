Here’s a **detailed documentation** for your `DynamoDBController`. This includes an overview of each endpoint, expected request and response formats, authentication details, and usage examples.

---

# **DynamoDB Controller API Documentation**
This controller provides a set of API endpoints to interact with AWS DynamoDB. It includes operations for storing commands, retrieving stored data, creating tables, listing tables, and fetching data from specific tables.

## **Authentication**
- All routes in this controller are protected by **AWS Cognito authentication**.
- Users must include a **Bearer Token** (JWT) in the request headers.
- API authentication is enforced using `@UseGuards(CognitoAuthGuard)`.

---

## **API Endpoints**

### **1. Store a Command in DynamoDB**
#### **Endpoint:**
```http
POST /api/dynamodb/store-command
```
#### **Description:**
Stores a command as a record in DynamoDB.

#### **Request Body:**
```json
{
  "command": "sudo apt update"
}
```
| Parameter  | Type   | Description          |
|------------|--------|----------------------|
| command    | string | The command to store |

#### **Response:**
```json
{
  "message": "Command stored successfully"
}
```
#### **Response Codes:**
- `201 Created` – Successfully stored the command.
- `401 Unauthorized` – If authentication is missing or invalid.

---

### **2. Retrieve Stored Commands**
#### **Endpoint:**
```http
GET /api/dynamodb/stored-commands
```
#### **Description:**
Retrieves all stored commands from DynamoDB.

#### **Response:**
```json
{
  "commands": [
    { "command": "sudo apt update", "timestamp": "2025-03-25T10:00:00Z" },
    { "command": "ls -la", "timestamp": "2025-03-25T10:05:00Z" }
  ]
}
```
#### **Response Codes:**
- `200 OK` – Successfully retrieved stored commands.
- `401 Unauthorized` – If authentication is missing or invalid.

---

### **3. Create a New DynamoDB Table**
#### **Endpoint:**
```http
POST /api/dynamodb/create-table
```
#### **Description:**
Creates a new table in DynamoDB.

#### **Request Body:**
```json
{
  "tableName": "Users",
  "keySchema": [{ "AttributeName": "userId", "KeyType": "HASH" }],
  "attributeDefinitions": [{ "AttributeName": "userId", "AttributeType": "S" }],
  "provisionedThroughput": { "ReadCapacityUnits": 5, "WriteCapacityUnits": 5 }
}
```
| Parameter                | Type   | Description                                        |
|--------------------------|--------|----------------------------------------------------|
| tableName               | string | Name of the new table                             |
| keySchema               | array  | Defines the primary key structure                 |
| attributeDefinitions    | array  | Specifies attributes and their data types        |
| provisionedThroughput   | object | Read and write capacity units                    |

#### **Response:**
```json
{
  "message": "Table Users created successfully"
}
```
#### **Response Codes:**
- `201 Created` – Successfully created the table.
- `400 Bad Request` – If table parameters are incorrect.
- `401 Unauthorized` – If authentication is missing or invalid.

---

### **4. List All DynamoDB Tables**
#### **Endpoint:**
```http
GET /api/dynamodb/list-tables
```
#### **Description:**
Returns a list of all tables in DynamoDB.

#### **Response:**
```json
{
  "tableNames": ["Users", "Orders", "Products", "Logs"]
}
```
#### **Response Codes:**
- `200 OK` – Successfully retrieved the table names.
- `401 Unauthorized` – If authentication is missing or invalid.

---

### **5. Retrieve Stored Data from a Specific Table**
#### **Endpoint:**
```http
GET /api/dynamodb/list-data/:tableName
```
#### **Description:**
Fetches all stored data from a given DynamoDB table.

#### **Path Parameter:**
| Parameter  | Type   | Description                  |
|------------|--------|------------------------------|
| tableName  | string | Name of the table to query  |

#### **Example Request:**
```http
GET /api/dynamodb/list-data/Users
```

#### **Response:**
```json
{
  "items": [
    {
      "userId": { "S": "123" },
      "name": { "S": "John Doe" },
      "email": { "S": "john@example.com" }
    },
    {
      "userId": { "S": "456" },
      "name": { "S": "Jane Doe" },
      "email": { "S": "jane@example.com" }
    }
  ]
}
```
#### **Response Codes:**
- `200 OK` – Successfully retrieved data.
- `404 Not Found` – If the specified table does not exist.
- `401 Unauthorized` – If authentication is missing or invalid.

---

## **Error Handling**
All endpoints return proper HTTP status codes and JSON responses.

| Status Code | Description                                          |
|-------------|------------------------------------------------------|
| 200 OK     | Request was successful                              |
| 201 Created | Data was successfully stored/created                |
| 400 Bad Request | Invalid request parameters                     |
| 401 Unauthorized | Missing or invalid authentication token      |
| 404 Not Found | The requested table does not exist               |
| 500 Internal Server Error | Unexpected server error              |

---

## **Authentication Example**
To access the endpoints, you need to pass a **Bearer Token** in the request headers.

### **Example Header:**
```http
Authorization: Bearer <your-jwt-token>
```

---

## **Conclusion**
This API provides secure interactions with DynamoDB, allowing storage, retrieval, and management of data. Each request is authenticated via AWS Cognito to ensure security.

🚀 Let me know if you need any additional details! 😊
