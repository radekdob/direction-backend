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

### Initiate Prisma (only once):
```Bash
npx prisma init
```
### Prisma Migration (every time when there is schema change):
```Bash
yarn prisma migrate dev
```



### Run the Application Development mode:

```Bash
yarn build
yarn dev
```


### Run locally using Docker

Build the image locally with a tag.

```Bash
docker build -t travelzoom-backend:0.0.1 .
```

Run the image passing the `--env-file` flag with a valid .env file containing the up to date values. 

```Bash
docker run -p 8000:8000 --env-file .env -it --rm -d travelzoom-backend:0.0.1
```

Test it's running by checking the version endpoint.

```Bash
curl localhost:8000/api/version
{"version":"0.1.23"}
```