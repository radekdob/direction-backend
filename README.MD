### Prerequisites

- **Node.js:** Version 20 or later
- **Yarn:** Latest Version
- **Git:** For cloning the repository
- **A supported database:** Postgres and Neo4J

### Clone the Repository:

### Install Dependencies:

```Bash
yarn
```

Set Up Environment Variables: Create a .env file and populate it with the necessary environment variables, such as database connection details, JWT secret, and other application-specific settings.
**An example .env file is provided in the repository.**


### Initiate Prisma:
```Bash
yarn prisma migrate dev
```



### Run the Application Development mode:

```Bash
yarn build
yarn dev
```

