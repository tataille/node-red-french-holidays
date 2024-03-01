# Release notes

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.2.2

- New field for current holidays end date __schoolHolidaysEndDate__

## 1.2.1

- Fix zones issue returned as "Non Disponible"

## 1.2.0

- Add new fields for debug purpose:
  - Package version - field __version__
  - Academy - field __academy__
  - Region - field __region__
  - Zones - fied __zones__

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