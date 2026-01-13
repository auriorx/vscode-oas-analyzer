# OAS Analyzer Extension - Usage Demo

## How to Generate Components

1. **Open your OpenAPI YAML file** in VS Code
2. **Type the shortcut** where you want to add paths:
   ```yaml
   paths:
     crud:PlatformUser
   ```
3. **The extension automatically expands it** to full CRUD paths:
   - GET /platform-users (list)
   - POST /platform-users (create)
   - GET /platform-users/{platformuserId} (get one)
   - PUT /platform-users/{platformuserId} (update)
   - DELETE /platform-users/{platformuserId} (delete)

4. **Missing components are auto-generated**:
   - Parameters: `PlatformUserId`, `Sort.PlatformUsers`
   - Request Bodies: `PostPlatformUsersRequest`, `PutPlatformUserRequest`
   - Responses: `GetPlatformUserResponse`, `GetPlatformUsersResponse`
   - Schemas: `PlatformUser`, `PlatformUser.Updated`, `PlatformUsers.New`, `PaginatedPlatformUsers`, `PlatformUsers`, `Sort.PlatformUser`, `Sort.PlatformUsers`

## What Gets Generated

### Entity-Specific (created for each entity):
- `PlatformUserId` parameter (path param with lowercase: `platformuserId`)
- `Sort.PlatformUsers` parameter (query param for sorting)
- Request bodies for POST/PUT operations
- Response schemas
- Entity schemas with proper naming
- Sort enum and array schemas

### Generic (referenced but not duplicated):
- `PaginationLimit`, `PaginationOffset` - pagination parameters
- `CorrelationId` - correlation tracking header
- Error responses (`BadRequestResponse`, `UnauthorizedResponse`, etc.)
- `Pagination` schema
- `ErrorResponse`, `CreatedResource` schemas

## Example Workflow

Starting with minimal file:
```yaml
openapi: 3.0.3
info:
  title: My API
  version: "1.0.0"
paths:
  # Type: crud:PlatformUser
components:
  parameters:
  requestBodies:
  responses:
  schemas:
```

After expansion, you get complete CRUD operations with all necessary components automatically generated!

## Current Output from Templates

The generated components match the pattern shown in `test-output.yaml`:
- ✅ Paths: `/platform-users` and `/platform-users/{platformuserId}`
- ✅ Parameter naming: lowercase `platformuserId`
- ✅ Sort parameter: Entity-specific `Sort.PlatformUsers`
- ✅ Pagination: References `PaginationLimit`/`PaginationOffset`
- ✅ Arrays: `PlatformUsers` correctly references singular `PlatformUser`
