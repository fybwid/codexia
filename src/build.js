'use strict'

const { as } = require('@cuties/cutie')
const {
  ExecutedLint,
  ExecutedTestCoverageCheck,
  ExecutedTestCoverage
} = require('@cuties/wall')
const { Logged } = require('@cuties/async')
const PulledPostgresByDocker = require('./async/dockerized-postgres/PulledPostgresByDocker')
const StartedPostgresContainer = require('./async/dockerized-postgres/StartedPostgresContainer')
const KilledPostgresContainer = require('./async/dockerized-postgres/KilledPostgresContainer')
const AppliedLiquibaseMigrations = require('./async/liquibase/AppliedLiquibaseMigrations')
const liquibase = require('liquibase')

new ExecutedLint(
  process,
  './src/app.js',
  './src/build.js',
  './src/async',
  './src/endpoints',
  './src/events'
).after(
  new ExecutedTestCoverageCheck(
    new ExecutedTestCoverage(process, './test.js'),
    { 'lines': 100, 'functions': 100, 'branches': 100 }
  ).after(
    new PulledPostgresByDocker().after(
      new StartedPostgresContainer(
        {
          'containerName': 'codexia-postgres-test-container',
          'port': '5401:5432',
          'user': 'test',
          'db': 'test',
          'password': '1234'
        }
      ).as('PG_CONTAINER').after(
        new AppliedLiquibaseMigrations(
          liquibase,
          {
            'liquibase': 'node_modules/liquibase-deps/liquibase-core-3.5.3.jar',
            'classpath': 'node_modules/liquibase-deps/postgresql-9.4-1201.jdbc4.jar',
            'changeLogFile': 'resources/liquibase/db.changelog.xml',
            'url': 'jdbc:postgresql://localhost:5401/test',
            'username': 'test',
            'password': '1234'
          }
        ).after(
          new Logged(
            'liquibase migrations are applied'
          ).after(
            new KilledPostgresContainer(
              as('PG_CONTAINER')
            )
          )
        )
      )
    )
  )
).call()
