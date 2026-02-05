@echo off

IF "%~1" == "" (
    ECHO No Comment provided.
    EXIT /B 1
) 

git add .
git commit -m %1
git push


:: echo Hello, %1!