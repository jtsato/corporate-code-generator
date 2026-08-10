@ECHO OFF
REM Developer task runner for wallet-service.
REM
REM This is a thin dispatcher over Maven. It exists so the commands that are
REM easy to forget - the ones behind opt-in profiles - are discoverable from
REM the project root. Anything it does can be done by calling Maven directly.
SETLOCAL

SET "TASK=%~1"
IF "%TASK%"=="" SET "TASK=verify"

IF /I "%TASK%"=="app" (
    mvn spring-boot:run -pl configuration -am
    EXIT /B %ERRORLEVEL%
)
IF /I "%TASK%"=="test" (
    mvn test
    EXIT /B %ERRORLEVEL%
)
IF /I "%TASK%"=="verify" (
    mvn clean verify
    EXIT /B %ERRORLEVEL%
)
IF /I "%TASK%"=="mutation" (
    mvn -P mutation -pl core verify
    EXIT /B %ERRORLEVEL%
)
IF /I "%TASK%"=="integration" (
    mvn -P integration-test -pl infra/database -am verify
    EXIT /B %ERRORLEVEL%
)
IF /I "%TASK%"=="help" GOTO :usage
IF /I "%TASK%"=="-h" GOTO :usage
IF /I "%TASK%"=="--help" GOTO :usage

ECHO Unknown task: %TASK%>&2
ECHO.>&2
CALL :usage
EXIT /B 1

:usage
ECHO Usage: run.cmd ^<task^>
ECHO.
ECHO Tasks:
ECHO   app - Run the application locally
ECHO   test - Run the unit and slice tests
ECHO   verify - Full build with coverage
ECHO   mutation - Mutation testing (PIT) on core
ECHO   integration - Database integration tests (needs Docker)
ECHO.
ECHO Default task: verify
EXIT /B 0
