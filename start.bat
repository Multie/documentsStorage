@echo off

cd D:\Users\multi\Projects\documentsStorage\server
start "" nodemon server.js
cd D:\Users\multi\Projects\documentsStorage\page
start "" ng serve
