@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

IF /I "%~1"=="/?" GOTO help
IF /I "%~1"=="--help" GOTO help

IF /I "%~1"=="clean" GOTO clean
IF /I "%~1"=="typecheck" GOTO typecheck
IF /I "%~1"=="test" GOTO test
IF /I "%~1"=="smoke" GOTO smoke
IF /I "%~1"=="build" GOTO build
IF /I "%~1"=="coverage" GOTO coverage
IF /I "%~1"=="mutation" GOTO mutation

GOTO help


:help
ECHO.
ECHO Corporate Code Generator
ECHO.
ECHO Usage:
ECHO   %~0 [clean] [typecheck] [test] [smoke] [build] [coverage] [mutation]
ECHO.
ECHO Parameter List:
ECHO.
ECHO   clean       Removes generated files and rebuild artifacts.
ECHO   typecheck   Runs TypeScript type checking.
ECHO   test        Runs unit tests.
ECHO   smoke       Runs smoke tests.
ECHO   build       Builds the project.
ECHO   coverage    Runs tests and generates a coverage report.
ECHO   mutation    Runs mutation testing with Stryker.
ECHO.
ECHO   /?           Displays this help message.
ECHO   --help       Displays this help message.
ECHO.
ECHO Examples:
ECHO.
ECHO   %~0 typecheck
ECHO   %~0 test
ECHO   %~0 smoke
ECHO   %~0 build
ECHO   %~0 coverage
ECHO   %~0 mutation
ECHO.
ECHO Commands can also be chained after clean:
ECHO.
ECHO   %~0 clean typecheck
ECHO   %~0 clean test
ECHO   %~0 clean build
ECHO.

GOTO end


:clean
ECHO.
ECHO ========================================
ECHO Cleaning project...
ECHO ========================================
ECHO.

CALL npm run clean
IF ERRORLEVEL 1 GOTO error

IF EXIST coverage (
    ECHO Removing coverage...
    RD /S /Q coverage
)

IF EXIST reports (
    ECHO Removing reports...
    RD /S /Q reports
)

IF EXIST .stryker-tmp (
    ECHO Removing Stryker temporary files...
    RD /S /Q .stryker-tmp
)

IF EXIST stryker-output (
    ECHO Removing Stryker output...
    RD /S /Q stryker-output
)

FOR /D /R %%D IN (dist) DO (
    IF EXIST "%%D" (
        ECHO Removing %%D
        RD /S /Q "%%D"
    )
)

IF /I "%~2"=="typecheck" GOTO typecheck
IF /I "%~2"=="test" GOTO test
IF /I "%~2"=="smoke" GOTO smoke
IF /I "%~2"=="build" GOTO build
IF /I "%~2"=="coverage" GOTO coverage
IF /I "%~2"=="mutation" GOTO mutation

ECHO.
ECHO Clean completed successfully.

GOTO end


:typecheck
ECHO.
ECHO ========================================
ECHO Type checking...
ECHO ========================================
ECHO.

CALL npm run typecheck
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Type checking completed successfully.

GOTO end


:test
ECHO.
ECHO ========================================
ECHO Running tests...
ECHO ========================================
ECHO.

CALL npm test
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Tests completed successfully.

GOTO end


:smoke
ECHO.
ECHO ========================================
ECHO Running smoke tests...
ECHO ========================================
ECHO.

CALL npm run smoke
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Smoke tests completed successfully.

GOTO end


:build
ECHO.
ECHO ========================================
ECHO Building project...
ECHO ========================================
ECHO.

CALL npm run build
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Build completed successfully.

GOTO end


:coverage
ECHO.
ECHO ========================================
ECHO Running tests with coverage...
ECHO ========================================
ECHO.

CALL npm run test:coverage
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Coverage completed successfully.

IF EXIST coverage\index.html (
    ECHO.
    ECHO Opening coverage report...
    START "" coverage\index.html
) ELSE (
    IF EXIST coverage\lcov-report\index.html (
        ECHO.
        ECHO Opening coverage report...
        START "" coverage\lcov-report\index.html
    )
)

GOTO end


:mutation
ECHO.
ECHO ========================================
ECHO Running mutation tests...
ECHO ========================================
ECHO.

CALL npm run mutation
IF ERRORLEVEL 1 GOTO error

ECHO.
ECHO Mutation testing completed successfully.

IF EXIST reports\mutation\mutation.html (
    ECHO.
    ECHO Opening mutation report...
    START "" reports\mutation\mutation.html
)

GOTO end


:error
ECHO.
ECHO ========================================
ECHO ERROR
ECHO ========================================
ECHO.
ECHO Command failed with exit code %ERRORLEVEL%.
ECHO.

EXIT /B 1


:end
ENDLOCAL
