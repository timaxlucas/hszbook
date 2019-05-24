# hszbook 
[![Build Status](https://travis-ci.com/timaxlucas/hszbook.svg?token=1w81GuSsC3hkfgp1JvDQ&branch=master)](https://travis-ci.com/timaxlucas/hszbook) ![npm](https://img.shields.io/npm/v/hszbook.svg)

 Automatically apply for RWTH-Aachen sport courses in [Node](https://nodejs.org/en/).
 

```javascript
const { registerForCourse } = require('hszbook');

const { success, message } = await registerForCourse(
  'https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html',
  '11259871', // course id
  { // data object
    firstname: 'max',
    surname: 'musterman',
    gender: 'male',
    street: 'moo street 13',
    city: '12345 city',
    matrnr: '123456',
    email: 'asd@fgh.com',
    phone: '0123456789',
    iban: '...'
  }
);
```
