# hszbook [![Build Status](https://travis-ci.com/timaxlucas/hszbook.svg?token=1w81GuSsC3hkfgp1JvDQ&branch=master)](https://travis-ci.com/timaxlucas/hszbook)

 Automaticly register for RWTH-Aachen sport courses
 
 ## Getting started

```javascript
// getting course data from hsz page
const res = await getData('https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html');

// registering for course by id
const { success, message } = await registerForCourse(
  'https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html',
  '11259871', // course id
  { // data object
    firstname: 'max',
    surname: 'musterman',
    street: 'moo street 13',
    city: '12345 city',
    matrnr: '123456',
    email: 'asd@fgh.com',
    phone: '0123456789',
    iban: '...'
  }
);
```