#!/usr/bin/env sh
# Developer task runner for wallet-service.
#
# This is a thin dispatcher over Maven. It exists so the commands that are easy
# to forget - the ones behind opt-in profiles - are discoverable from the
# project root. Anything it does can be done by calling Maven directly.
set -eu

usage() {
  echo "Usage: sh run.sh <task>"
  echo
  echo "Tasks:"
  printf '  %-13s %s\n' 'app' 'Run the application locally'
  printf '  %-13s %s\n' 'test' 'Run the unit and slice tests'
  printf '  %-13s %s\n' 'verify' 'Full build with coverage'
  printf '  %-13s %s\n' 'mutation' 'Mutation testing (PIT) on core'
  printf '  %-13s %s\n' 'integration' 'Database integration tests (needs Docker)'
  echo
  echo "Default task: verify"
}

task="${1:-verify}"

case "$task" in
  app)
    exec mvn spring-boot:run -pl configuration -am
    ;;
  test)
    exec mvn test
    ;;
  verify)
    exec mvn clean verify
    ;;
  mutation)
    exec mvn -P mutation -pl core verify
    ;;
  integration)
    exec mvn -P integration-test -pl infra/database -am verify
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown task: $task" >&2
    echo >&2
    usage >&2
    exit 1
    ;;
esac
