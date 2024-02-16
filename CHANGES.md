# Release notes

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).


## 1.1.9

- Fixed issue:
  - is school holidays failed #12
  - Update package references to fix security issues

## 1.1.8

- Fix "isSchoolHolidays - Issue with year selection ? #10"
- Enhance logs
- Fix issue with field _schoolHolidaysName_ (current school Holidays name)that was always null
- New field _schoolPeriod_ containing current school period with format "< Start of School Period >-< End of School Period >"

## 1.1.7

- Fix issue when multiple instances of the module is deployed in NodeRed. Output is mixed between modules and flows/ subflows

## 1.1.6

- Fix Year Interval

## 1.1.5

- Fix Promise rejection
- Enhance Errors handling

## 1.1.4

- Fix years interval

## 1.1.3

- Fix wrong returned year

## 1.1.2

- Have to set the previous year to get all the Holidays in French Government API