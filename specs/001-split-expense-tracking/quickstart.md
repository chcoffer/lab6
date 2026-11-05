# Quickstart: SplitSmart Architecture Setup

## Prerequisites

- Java 21 JDK
- Maven 3.9+
- Git
- A PostgreSQL instance for the production-style environment
- Optional: H2 for local development and repository/integration testing

## Local Development Workflow

### 1. Clone the repository and open the project

```bash
git clone <repo-url>
cd lab6
```

### 2. Configure environment variables or `application.properties`

Set the database connection details and local configuration for the chosen environment. The desktop MVP should keep database configuration isolated in a config class or external properties file.

### 3. Build the project

```bash
mvn clean compile
```

### 4. Run unit and integration tests

```bash
mvn test
```

### 5. Package the application

```bash
mvn package
```

## Recommended Architecture Flow

1. User interacts with a Swing screen.
2. Controller translates the action to a domain-level service call.
3. Service performs validation, authorization, and ledger logic.
4. Repository persists the observed state in the database.
5. Notification and report services can be triggered after state changes.

## Testing Strategy

The domain and service layers should be tested first because they contain the actual financial rules. Focused JUnit 5 test coverage should include:

- validating positive expense amounts
- equal split allocation and final-cent remainder assignment
- percentage split totals equaling 100%
- approval blocking before ledger updates
- payment settlement reducing open balances
- authorization restrictions for group admins/reviewers

## Architecture Notes

- The presentation layer is intentionally thin and should not contain authoritative balance logic.
- The service layer is the system of record for money and approval behavior.
- Database access is isolated behind repositories and transaction boundaries.
- The project is intentionally scoped to the Java Swing MVP, while leaving a clean service boundary for future web or mobile front ends.

## Common Commands

```bash
mvn test
mvn clean verify
mvn -DskipTests package
```

## Future Extension Path

To support web or mobile clients later, add an API layer in front of the same application services and domain model. The domain rules remain unchanged; only the interface and transport layer would differ.
